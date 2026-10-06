python3 - <<'PY'
t=open('template.html').read()
for k,f in [('/*THREE*/','lib/three.min.js'),('/*ORBIT*/','lib/OrbitControls.js'),('/*APP*/','app.js')]:
    t=t.replace(k,open(f).read().replace('</script>','<\\/script>'))
open('mieszkanie-3d.html','w').write(t)
PY
