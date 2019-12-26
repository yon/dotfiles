DOTFILE_DIR := $(HOME)/.files
EXCLUDES := . .. .git
DOTFILES := $(filter-out $(EXCLUDES), $(shell ls -A -1 $(DOTFILE_DIR)))

default:	setup update clean link set_permissions

clean:
	for file in $(DOTFILES); do \
		/bin/rm -f -r $(HOME)/$${file}; \
	done

link:	link_global link_local

link_global:	DOTFILES_GLOBAL := $(filter-out $(wildcard .*.local), $(DOTFILES))
link_global:
	for file in $(DOTFILES_GLOBAL); do \
		/bin/ln -n -s $(DOTFILE_DIR)/$${file} $(HOME)/$${file}; \
	done

link_local:	DOTFILES_LOCAL := $(filter $(wildcard .*.local), $(DOTFILES))
link_local:
	if [ -n "$(SSH_CLIENT)" ]; then \
		for file in $(DOTFILES_LOCAL); do \
			/bin/ln -n -s $(DOTFILE_DIR)/$${file} $(HOME)/$${file}; \
		done \
	fi

set_permissions:
	chmod 700 $(HOME);
	chmod -R u=rwX,g=rX,o= $(DOTFILE_DIR);
	chmod -R u=rwX,go= $(DOTFILE_DIR)/.ssh;

setup:
	if [ ! -d $(DOTFILE_DIR) ]; then \
		git clone git@github.com:yon/dotfiles.git $(DOTFILE_DIR); \
	fi

update:	setup
	cd $(DOTFILE_DIR) && git pull && cd $(HOME);
