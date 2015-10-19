HOME_REPO=$(HOME)/.home

default:	setup update clean link set_permissions

clean:
	for file in `ls -A -1 $(HOME_REPO)`; do \
		/bin/rm -f -r $(HOME)/$${file}; \
	done

link:
	for file in `ls -A -1 $(HOME_REPO)`; do \
		/bin/ln -n -s $(HOME_REPO)/$${file} $(HOME)/$${file}; \
	done

set_permissions:
	chmod 700 $(HOME);
	chmod -R u=rwX,g=rX,o= $(HOME_REPO);
	chmod -R u=rwX,go= $(HOME_REPO)/.ssh;

setup:
	if [ ! -d $(HOME_REPO) ]; then \
		git clone git@github.com:yon/home.git $(HOME_REPO); \
	fi

update:	setup
	cd $(HOME_REPO) && git pull && cd $(HOME);
