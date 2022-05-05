# this will download all dependencies for Ubuntu 16 (fift, func executables) and place them in ./bin
mkdir bin
wget https://github.com/ton-defi-org/ton-binaries/releases/download/ubuntu-16/fift -P ./bin
chmod +x ./bin/fift
wget https://github.com/ton-defi-org/ton-binaries/releases/download/ubuntu-16/func -P ./bin
chmod +x ./bin/func
wget https://github.com/ton-defi-org/ton-binaries/releases/download/fiftlib/fiftlib.zip -P ./bin
unzip ./bin/fiftlib.zip -d ./bin/fiftlib