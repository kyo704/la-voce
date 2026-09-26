#!/usr/bin/env python3
"""★台帳は あるのに ★見本に 画面が 無い ものを 見つける。
★2026-09-25: ★今日 書いた SQL 4本とも ★画面が ありませんでした
  （振替・出演料・下見リンク・アプリから引用）
★台帳だけ あって 画面が 無い ＝ ★誰も 使えません。★その逆（画面だけ）も 出します
使い方: python3 tools/ledger_without_screen.py [--selftest]
★対応表（tools/screen_ops.json）の「書く／読む／関数」に 出てくる 表と、
★sql/ の create table を 突き合わせます"""
import json, os, re, sys, glob
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
OPS=os.path.join(HERE,'screen_ops.json')

def tables_in_sql():
    """★sql/ で 作っている 表"""
    out={}
    for f in sorted(glob.glob(os.path.join(PACK,'sql','*.sql'))):
        s=open(f,encoding='utf-8',errors='replace').read()
        for m in re.finditer(r'create table if not exists\s+public\.([a-z_]+)', s):
            out.setdefault(m.group(1), os.path.basename(f))
        for m in re.finditer(r'create table\s+public\.([a-z_]+)', s):
            out.setdefault(m.group(1), os.path.basename(f))
    return out

def tables_in_ops():
    """★対応表で 使っている 表"""
    d=json.load(open(OPS,encoding='utf-8'))
    used=set()
    for k,o in d.items():
        if k.startswith('_'): continue
        for x in (o.get('w',[]) + o.get('r',[])):
            t=re.split(r'[.(（]', x)[0].strip()
            if re.fullmatch(r'[a-z_]{3,}', t): used.add(t)
    return used

# ★裏方の 表（★画面を 持たないのが 正しい）
BACKSTAGE={'ops_alerts','ops_audit_log','retention_runs','stripe_events','webhook_events',
 'subscription_items','work_imports','works_imports','work_instruments','work_scene_roles',
 'org_billing_log','post_change_log','score_log','monka_read_log','koen_kid_contact_reads',
 'org_post_perm_log','export_log','age_answer_changes','account_deletions','blocked_senders',
 'page_template_slots','page_type_catalog','minor_billing_consents','student_price_consents',
 'consent_records','guardian_consents','feature_flags','sku_features','koen_kind_words'}

def analyse(sql_tables, used, backstage=BACKSTAGE):
    """★裏方の 表は 除く（★画面を 持たないのが 正しい もの）"""
    return sorted(t for t in sql_tables if t not in used and t not in backstage)

def main():
    sql_tables=tables_in_sql(); used=tables_in_ops()
    rows=analyse(sql_tables, used)
    print('LEDGER_WITHOUT_SCREEN　sql の表', len(sql_tables), '／対応表で 使っている', len(used),
          '／裏方（除く）', len(BACKSTAGE))
    for t in rows:
        print('  DIFF ★台帳は あるが 見本に 画面が 無い |', t, '|', sql_tables[t])
    if rows:
        print('★どれかを 1つずつ 見てください:')
        print('  ・画面が 要る → 見本に 作る　・要らない → その SQL を 当てない')
        print(f'RESULT: 候補 {len(rows)}件'); return 0
    print('RESULT: MATCH（★台帳と 画面が そろっています）'); return 0

def selftest():
    got=analyse({'aaa':'01.sql','bbb':'02.sql'}, {'aaa'}, backstage=set())
    assert got==['bbb'], got
    assert analyse({'aaa':'01.sql'}, {'aaa'}, backstage=set())==[], '差が 無いのに 出た'
    assert analyse({'zzz':'03.sql'}, set(), backstage={'zzz'})==[], '★裏方を 除けていない'
    print('SELFTEST PASS'); return 0

if __name__=='__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
