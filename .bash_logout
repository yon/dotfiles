[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

[ -d /tmp/xauth-${USER}-${$} ] && rm -rf /tmp/xauth-${USER}-${$};

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
