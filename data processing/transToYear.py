import json
f=open('crimedatadate.json')
dic=json.loads(next(f))
years={}
for i in dic:
	if years.get(i['_id'][-4:]):
		years[i['_id'][-4:]]+=i['count']
	else:
		years[i['_id'][-4:]]=i['count']
print(json.dumps(years))