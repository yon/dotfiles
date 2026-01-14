[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

[ -d ${HOME}/.files ] && (cd ${HOME}/.files && make -s);

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
