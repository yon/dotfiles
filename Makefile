DOTFILE_DIR := $(HOME)/.files
EXCLUDES := . .. .git
DOTFILES := $(filter-out $(EXCLUDES), $(shell ls -A -1 $(DOTFILE_DIR)))

default:	setup update clean link set_permissions

clean:
	for file in $(DOTFILES); do \
		/bin/rm -f -r $(HOME)/$${file}; \
	done

link:
	for file in $(DOTFILES); do \
		/bin/ln -n -s $(DOTFILE_DIR)/$${file} $(HOME)/$${file}; \
	done

set_permissions:
	chmod 700 $(HOME);
	chmod -R u=rwX,g=rX,o= $(DOTFILE_DIR);
	chmod -R u=rwX,go= $(DOTFILE_DIR)/.gnupg;
	chmod -R u=rwX,go= $(DOTFILE_DIR)/.ssh;

setup:
	if [ ! -d $(DOTFILE_DIR) ]; then \
		git clone git@github.com:yon/dotfiles.git $(DOTFILE_DIR); \
	fi

update:	setup
	cd $(DOTFILE_DIR) && git pull && cd $(HOME);
