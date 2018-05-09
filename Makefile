DOTFILES=$(HOME)/.files

default:	setup update clean link set_permissions

clean:
	for file in `ls -A -1 $(DOTFILES)`; do \
		/bin/rm -f -r $(HOME)/$${file}; \
	done

link:
	for file in `ls -A -1 $(DOTFILES)`; do \
		/bin/ln -n -s $(DOTFILES)/$${file} $(HOME)/$${file}; \
	done

set_permissions:
	chmod 700 $(HOME);
	chmod -R u=rwX,g=rX,o= $(DOTFILES);
	chmod -R u=rwX,go= $(DOTFILES)/.ssh;

setup:
	if [ ! -d $(DOTFILES) ]; then \
		git clone git@github.com:yon/dotfiles.git $(DOTFILES); \
	fi

update:	setup
	cd $(DOTFILES) && git pull && cd $(HOME);
