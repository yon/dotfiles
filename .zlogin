[ -n "${DEBUG}" ] && echo ">>> `basename $0`";

[ -z "${CLAUDECODE}" ] && [ -d ${HOME}/.files ] && (cd ${HOME}/.files && make -s);

[ -n "${DEBUG}" ] && echo "<<< `basename $0`";
