from dateutil.parser import parse
from collections import OrderedDict
import csv

h = OrderedDict(sorted(month.items(), key=lambda x: parse(x[0])))
n = []
m={'01':'Jan',
   '02':'Feb',
   '03':'Mar',
   '04':'Apr',
   '05':'May',
   '06':'Jun',
   '07':'Jul',
   '08':'Aug',
   '09':'Sep',
   '10':'Oct',
   '11':'Nov',
   '12':'Dec'}
for item in h:
    item = list(item)
    print(item)
    item[0] = item[0].replace('/',' ')
    if item[0][0:2] in m:
        item[0] = m[item[0][0:2]] + " " + item[0][3:8]
        print(item)
    n.append(item)

with open('dforYear.csv', 'w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerows(n)