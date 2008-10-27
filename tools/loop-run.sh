#!/bin/bash
while [ 1 ]; do 
    a=$(date); 
    echo;
    echo "=========="; 
    ./run.sh; 
    echo "=========="; 
    echo $a; echo $(date); 
    echo "=========="; 
    sleep 600; 
done
