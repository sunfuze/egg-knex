#! /usr/bin/usr bash
set -e
echo "Enter release version:   # support major | minor | patch | premajor | preminor | prepatch | prerelease | from-git"
read VERSION

read -p "Releasing $VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Releasing $VERSION ..."

  # run tests
  npm test 2>/dev/null

  # publish
  npm version $VERSION
  git push origin --tags
  git push
  npm publish
fi