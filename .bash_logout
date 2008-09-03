[ -n "${DEBUG}" ] && echo "... starting .bash_logout";

[ -d /tmp/xauth-${USER}-${$} ] && rm -rf /tmp/xauth-${USER}-${$};

[ -n "${DEBUG}" ] && echo "... ending .bash_logout";

# vim:ft=sh:
