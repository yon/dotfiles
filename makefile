HOMEDIRREPO=$(HOME)/.home

all:    clean link copy set_permissions

clean:
	for file in `ls -A -1 $(HOMEDIRREPO)`; do \
		rm -f -r $(HOME)/$${file}; \
	done

link:
	for file in `ls -A -1 $(HOMEDIRREPO)`; do \
		ln -n -s $(HOMEDIRREPO)/$${file} $(HOME)/$${file}; \
	done

copy:

set_permissions:
	chmod -R u=rwX,go= $(HOMEDIRREPO)/.ssh;
	chmod 700 $(HOME);
