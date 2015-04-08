# Install homebrew
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# Install brew cask
brew install caskroom/cask/brew-cask

# Install java and processing
brew cask install --appdir="/Applications" java processing

# Download processing-py for CLI
curl http://py.processing.org/processing.py-0202-macosx.tgz | tar xz

# Move and rename
mv processing.py-0202-macosx/ /Applications/processing-py

# Copy processing script over TODO: should make this /usr/local/bin to avoid sudo
./python/processing /usr/local/bin/processing

# Append /usr/local/bin to .profile
echo export PATH='$PATH:/usr/local/bin' >> ~/.profile