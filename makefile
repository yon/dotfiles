HOMEDIRREPO=$(HOME)/.home

all:    clean link copy

clean:
	for file in `ls -A -1 $(HOMEDIRREPO) | grep -v makefile`; do \
		rm -f -r $(HOME)/$${file}; \
	done

link:
	for file in `ls -A -1 $(HOMEDIRREPO) | grep -v makefile`; do \
		ln -n -s $(HOMEDIRREPO)/$${file} $(HOME)/$${file}; \
	done

copy:
