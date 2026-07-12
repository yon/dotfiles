DOTFILE_DIR := $(HOME)/.files
EXCLUDES := . .. .git
DOTFILES := $(filter-out $(EXCLUDES), $(shell ls -A -1 $(DOTFILE_DIR)))

default:	setup update clean link set_permissions

clean:
	for file in $(DOTFILES); do \
		/bin/rm -f -r $(HOME)/$${file}; \
	done
	for link in $(HOME)/.[!.]* $(HOME)/*; do \
		if [ -L "$${link}" ] && [ ! -e "$${link}" ]; then \
			case "$$(readlink "$${link}")" in \
			$(DOTFILE_DIR)/*) /bin/rm -f "$${link}";; \
			esac; \
		fi; \
	done

link:
	for file in $(DOTFILES); do \
		/bin/ln -n -s $(DOTFILE_DIR)/$${file} $(HOME)/$${file}; \
	done

set_permissions:
	chmod 700 $(HOME);
	chmod u=rwX,g=rX,o= $(DOTFILE_DIR);
	for file in $(DOTFILES); do \
		case "$${file}" in \
		.claude|.gnupg|.ssh) ;; \
		*) chmod -R u=rwX,g=rX,o= $(DOTFILE_DIR)/$${file};; \
		esac; \
	done
	chmod -R u=rwX,go= $(DOTFILE_DIR)/.gnupg;
	chmod -R u=rwX,go= $(DOTFILE_DIR)/.ssh;

setup:
	if [ ! -d $(DOTFILE_DIR) ]; then \
		git clone https://github.com/yon/dotfiles.git $(DOTFILE_DIR); \
	fi

update:	setup
	cd $(DOTFILE_DIR) && git pull && cd $(HOME);
