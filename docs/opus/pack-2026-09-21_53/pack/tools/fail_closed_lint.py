#!/usr/bin/env python3
"""fail closed の検査（作成 Opus／実行 Code）。移行の SQL（supabase/migrations/*.sql）の関数を読み、
「記録の表（*_log）に書く関数」が安全側に倒れているかを確かめる。静的な検査なので、動く証明は別に試験で（型は下）。
確かめること（*_log へ insert する関数ごと）:
  F1 記録の insert が、中身を返す（return query／return／select … into の後の return）より前にある
  F2 記録の insert が exception when … で握りつぶされていない（others を捕まえて続ける形が無い）
  F3 記録の insert に on conflict do nothing が無い（黙って書かないが起きる）
  F4 security definer なら set search_path がある（★記録を書かない関数にも かける）
  F5 anon に実行権を渡していない（★記録を書かない関数にも かける）
使い方: python3 tools/fail_closed_lint.py <migrations のフォルダ>  ／  --selftest
★コメント（-- と /* */）と文字列は先に取り除いてから調べる（裁定135・158 の型の誤りを避ける）
動く証明（試験）の型: 試しの環境で、記録の表に書けない状態を作り（その表の insert の権限を試しの利用者から外す等）、
  実在の試しの利用者で RPC を呼ぶ → 中身が0行かエラー。なりすましは使わない"""
import re, os, sys, glob
# ★未ログインに渡すことを 意図して決めた関数（理由つき）。ここに無いものが渡されていたら 赤にする
ANON_OK={
 'get_public_portfolio':'公開ページ（裁定128）。中で 止められている人・切った相手を外している',
 'submit_inquiry':'お問い合わせの受け口（裁定129）。書くだけで 読めない',
 'accept_guardian_consent':'保護者の同意（合言葉で受ける・裁定147）。理由を返さない作り',
 'org_free_period':'導入期間の判定（個人のものを含まない）',
 'koen_tier_price':'公演の値段の計算（個人のものを含まない）',
}
def strip_sql(s):
    s=re.sub(r"/\*[\s\S]*?\*/"," ",s); s=re.sub(r"--[^\n]*"," ",s)
    s=re.sub(r"\$(\w*)\$",lambda m:m.group(0),s)   # 本体の $$ は残す
    return re.sub(r"'(?:''|[^'])*'","''",s)
def functions(sql):
    for m in re.finditer(r"create\s+(?:or\s+replace\s+)?function\s+([\w\.\"]+)\s*\(([\s\S]*?)\$(\w*)\$([\s\S]*?)\$\3\$([^;]*);",sql,re.I):
        yield m.group(1),m.group(2)+' '+m.group(5),m.group(4)
def lint(sql):
    raw=sql; sql=strip_sql(sql); out=[]
    for name,head,body in functions(sql):
        # ★F4・F5 は 記録を書かない関数にも かける（2026-09-23 に 壊して確かめて分かった抜け）
        if re.search(r"security\s+definer",head,re.I) and not re.search(r"set\s+search_path",head,re.I):
            out.append((name,'F4','security definer なのに set search_path が無い'))
        short0=name.split('.')[-1].strip('"')
        if (short0 not in ANON_OK and
            re.search(r"grant\s+execute\s+on\s+function\s+[\w\.\"]*"+re.escape(short0)+r"[\s\S]{0,80}?\bto\s+(anon|public)\b",sql,re.I)):
            out.append((name,'F5','anon／public に実行権'))
        ins=[m.start() for m in re.finditer(r"insert\s+into\s+[\w\.\"]*_log\b",body,re.I)]
        if not ins: continue
        is_trigger=bool(re.search(r"returns\s+trigger",head,re.I))
        # ★ガード（何も 変える 前の 早い return）は 数えない。危ないのは「他の insert/update/delete を した あとで、
        #   記録の insert より 前に return して しまう」経路だけ
        mut=[p for p in re.finditer(r'\b(insert\s+into|update|delete\s+from)\s+([\w\."]+)',body,re.I) if not p.group(2).rstrip('"').split('.')[-1].endswith('_log')]
        mut_pos=[m.start() for m in mut]
        ret=[m.start() for m in re.finditer(r"\breturn\s+query\b|\breturn\s+(?!;)\S",body,re.I)]
        risky_ret=[r for r in ret if r<min(ins) and any(mp<r for mp in mut_pos)]
        if not is_trigger and risky_ret: out.append((name,'F1','他の書き込みの あとで、記録の insert より 前に return している経路が ある'))
        for m in re.finditer(r"exception\s+when\s+(others|[\w_]+)\s+then([\s\S]*?)(?=\bend\b)",body,re.I):
            kind,handler=m.group(1),m.group(2)
            # ★いちばん近い（内側の）begin から exception までを見る。
            #   関数の先頭の begin から取ると、外にある記録の insert まで拾って ★誤って赤くする
            #   （2026-09-23 に自分の SQL で 誤検知が出て分かった）
            begins=[b.start() for b in re.finditer(r"\bbegin\b", body[:m.start()], re.I)]
            guarded = body[begins[-1]:m.start()] if begins else body[:m.start()]
            if not re.search(r"_log\b",guarded,re.I): continue   # ★記録（_log）の insert を 囲んでいる 例外 だけを 見る。ほかの 表（通知など）への 例外は 対象外
            if not re.search(r"\braise\s*;|\braise\s+exception\b|\braise\s+sqlstate\b|\braise\s+'",handler,re.I): out.append((name,'F2',f'記録の insert を exception when {kind} で握りつぶしている（raise warning／notice は握りつぶしと同じ）'))
        if re.search(r"insert\s+into\s+[\w\.\"]*_log\b[\s\S]*?on\s+conflict\s+do\s+nothing",body,re.I): out.append((name,'F3','記録の insert に on conflict do nothing'))
    return out
def main(d):
    files=sorted(glob.glob(os.path.join(d,'**','*.sql'),recursive=True)); rows=[]
    for f in files:
        for r in lint(open(f,encoding='utf-8',errors='ignore').read()): rows.append((os.path.relpath(f,d),)+r)
    print(f'FAIL_CLOSED_LINT {len(files)}ファイル'); [print('  NG',' | '.join(r)) for r in rows]
    print('RESULT:','OK' if not rows else f'NG（{len(rows)}件）'); return 0 if not rows else 1
GOOD="""create or replace function read_monka(p uuid, r text) returns setof org_messages
language plpgsql security definer set search_path = public as $$
begin
  -- 先に記録。return query は ここより後
  insert into monka_read_log(who, monka, reason_kind) values (auth.uid(), p, r);
  return query select * from org_messages where monka_id = p;
end $$;
"""
BAD=GOOD.replace("  insert into monka_read_log(who, monka, reason_kind) values (auth.uid(), p, r);\n  return query select * from org_messages where monka_id = p;",
 "  update org_messages set opened=true where monka_id = p;\n  return query select * from org_messages where monka_id = p;\n  begin insert into monka_read_log(who, monka, reason_kind) values (auth.uid(), p, r) on conflict do nothing; exception when others then null; end;").replace(" set search_path = public","")+"grant execute on function read_monka(uuid,text) to anon;\n"
def selftest():
    ok=True
    if lint(GOOD): print('SELFTEST FAIL: 正しい関数で NG',lint(GOOD)); ok=False
    got={r[1] for r in lint(BAD)}
    for f in ['F1','F2','F3','F4','F5']:
        if f not in got: print('SELFTEST FAIL: 見つけられない',f); ok=False
    if lint("-- insert into x_log values(1); return 1;\n"): print('SELFTEST FAIL: コメントを拾った'); ok=False
    TRG="create function t() returns trigger language plpgsql security definer set search_path=public as $$ begin if old.a is not distinct from new.a then return new; end if; insert into a_log values(1); return new; end $$;"
    if lint(TRG): print('SELFTEST FAIL: 引き金の早い return を F1 にした'); ok=False
    # ★記録（_log）の insert を 中で握りつぶしている形（これは NG）
    WARN="create function w() returns int language plpgsql as $$ begin insert into n values(1); begin insert into b_log values(1); exception when others then raise warning 'x'; end; return 1; end $$;"
    if not any(r[1]=='F2' for r in lint(WARN)): print('SELFTEST FAIL: raise warning の握りつぶしを見逃した'); ok=False
    # ★記録は 外に出してあり、握りつぶしているのは ほかの表（通知など）── これは OK
    #   （2026-09-23: 以前は「いちばん外の begin」から見ていたため、★これを誤って NG にしていた）
    OKC="create function o2() returns int language plpgsql as $$ begin insert into b_log values(1); begin insert into n values(1); exception when others then raise warning 'x'; end; return 1; end $$;"
    if any(r[1]=='F2' for r in lint(OKC)): print('SELFTEST FAIL: ★記録が外にあるのに F2 にした（誤検知）'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if not a: print(__doc__); sys.exit(2)
    sys.exit(main(a[0]))
