#! /bin/bash -e
v1=`egrep version\": package.json`
v2=`egrep version\": package-lock.json | head -1`
if [[ "$v1" != "$v2" ]]; then
  echo Version mismatch: $v1 vs $v2
  echo Run npm i --package-lock-only
  exit 1
fi
version=`echo $v1 | sed -E 's/.*"([0-9]\..*)".*/\1/'`
echo "Pushing version ${version}"

# produce https.html
sed -E \
  -e '/<head>/a\
    <base href="https://s3.amazonaws.com/s3.voneicken.com/flexdash/'$version'/index.html" />' \
  <./dist/index.html >./docs/https.html

# produce http.html FIXME: support query string args
cat >./docs/http.html <<EOF
<html lang="en"><head>
<link rel="icon" href="./favicon.ico" />
<meta http-equiv="refresh" content="0; url=http://s3.amazonaws.com/s3.voneicken.com/flexdash/${version}/index.html">
</head><body>
Redirecting to <a href="http://s3.amazonaws.com/s3.voneicken.com/flexdash/${version}/index.html">
http://s3.amazonaws.com/s3.voneicken.com/flexdash/${version}/index.html</a>
</body></html>
EOF

echo "RUN: git add ./docs; git commit -m 'publish ${version}'; git push"

# --checksum: determine change based on hash and file size, mod time on S3 is bogus
# --immutable: don't want to overwrite previous release
OPTS=(--progress --checksum --immutable)
OPTS=("${OPTS[@]}" --config $HOME/.config/rclone/rclone.conf)
rclone "${OPTS[@]}" sync dist s3-public:s3.voneicken.com/flexdash/${version}
