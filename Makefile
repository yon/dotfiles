DOTFILE_DIR := $(HOME)/.files
EXCLUDES := . .. .git
DOTFILES := $(filter-out $(EXCLUDES), $(shell ls -A -1 $(DOTFILE_DIR)))
# Links inside directories that harnesses own, as <path under $HOME>=<path in this repo>.
HARNESS_LINKS := \
	.codex/AGENTS.md=.agents/AGENTS.md \
	.codex/rules/default.rules=.agents/codex/rules/default.rules \
	.config/opencode/AGENTS.md=.agents/AGENTS.md

default:	setup update clean link harness_links set_permissions

clean:
	for file in $(DOTFILES); do \
		if [ -L "$(HOME)/$${file}" ]; then \
			/bin/rm -f "$(HOME)/$${file}"; \
		elif [ -e "$(HOME)/$${file}" ]; then \
			echo "skip: $(HOME)/$${file} is not a symlink; move it aside to manage it here"; \
		fi; \
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
		if [ ! -e "$(HOME)/$${file}" ] && [ ! -L "$(HOME)/$${file}" ]; then \
			/bin/ln -n -s $(DOTFILE_DIR)/$${file} $(HOME)/$${file}; \
		fi; \
	done

harness_links:
	for pair in $(HARNESS_LINKS); do \
		target="$(HOME)/$${pair%%=*}"; source="$(DOTFILE_DIR)/$${pair#*=}"; \
		if [ -e "$${target}" ] && [ ! -L "$${target}" ]; then \
			echo "skip: $${target} is a real file; move it aside to link it"; \
		else \
			/bin/mkdir -p "$$(dirname "$${target}")" && /bin/ln -n -s -f "$${source}" "$${target}"; \
		fi; \
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

.PHONY: markdown-format markdown-format-check

markdown-format:
	bun .prettier/markdown.ts --write

markdown-format-check:
	bun .prettier/markdown.ts --check
