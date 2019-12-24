[ -n "${DEBUG}" ] && echo "... starting .zlogin";

# use sane control characters
# /bin/stty sane
# /bin/stty erase 

# ssh key management
if [ -r ${HOME}/.ssh/id_rsa ]; then
    if [ `which keychain` ]; then
        # `which keychain` --agents ssh --inherit any --quiet id_rsa;
        `which keychain` --agents gpg --inherit any --quiet $GPG_KEY_ID;
    fi
fi

if [ -d ${HOME}/.files ]
then
    make -s;
fi

[ -n "${DEBUG}" ] && echo "... ending .zlogin";
