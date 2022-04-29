#!/bin/bash

## cleanup
rm -rf *.fif

## build main.fc
cat ../contracts/lib/*.fc ../contracts/main.fc | func -APSI -o main.fif

## print all fif files that were built
echo "Build results:" && stat -f "%z %N" *.fif