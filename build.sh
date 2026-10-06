python3 - <<'PY'
t=open('template.html').read()
for k,f in [('/*THREE*/','lib/three.min.js'),('/*ORBIT*/','lib/OrbitControls.js'),('/*APP*/','app.js')]:
    t=t.replace(k,open(f).read().replace('</script>','<\\/script>'))
for output in ('index.html','mieszkanie-3d.html'):
    open(output,'w').write(t)
PY
