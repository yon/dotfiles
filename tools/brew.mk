default:	brew-cask

brew:	/usr/local/bin/brew

/usr/local/bin/brew:
	ruby -e "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

/usr/local/bin/brew-cask:
	brew install caskroom/cask/brew-cask

brew-cask: brew /usr/local/bin/brew-cask
