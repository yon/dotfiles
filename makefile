HOME_REPO=$(HOME)/.home

all:    clean link copy set_permissions

clean:
	for file in `ls -A -1 $(HOME_REPO)`; do \
		rm -f -r $(HOME)/$${file}; \
	done

clone:
	if [ ! -d $(HOME_REPO) ]; then \
		git clone git@github.com:yon/home.git $(HOME_REPO); \
	fi

copy:

link:
	for file in `ls -A -1 $(HOME_REPO)`; do \
		ln -n -s $(HOME_REPO)/$${file} $(HOME)/$${file}; \
	done

set_permissions:
	chmod 700 $(HOME);
	chmod -R u=rwX,g=rX,o= $(HOME_REPO);
	chmod -R u=rwX,go= $(HOME_REPO)/.ssh;
