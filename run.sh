#!/bin/sh
BASE_DIR=$( dirname $0 );
cd $BASE_DIR;
python venus/expunge.py conf/config.ini
python venus/planet.py -x conf/config.ini
