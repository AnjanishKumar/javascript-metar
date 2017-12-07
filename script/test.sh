#!/usr/bin/env bash
while IFS=';' read -r a b;
do
  curl "http://localhost:8080/metar/info?scode=$a&nocache=1";
done
#done < nsd_cccc.txt

