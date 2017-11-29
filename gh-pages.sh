git checkout master
git branch -D gh-pages
git checkout -b gh-pages

gulp

grep -vE "/\[0-9\]\*|/build" .gitignore > tmp
cp tmp .gitignore
rm tmp

git add .
git rm LICENSE .npmignore *.md *.js* *.sh
git commit -am 'removed all files except gitignore and build dirs'
git push --force origin gh-pages

git checkout master
git branch -D gh-pages
git branch -Dr origin/gh-pages
