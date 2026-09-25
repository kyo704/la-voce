select (d.d + make_interval(mins => 540)) at time zone 'Asia/Tokyo'
  from generate_series(now()::date, now()::date, interval '1 day') as d(d);
