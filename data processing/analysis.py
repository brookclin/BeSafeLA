from pymongo import MongoClient
import json
client = MongoClient()
db = client.crime
res=db.crimedata.aggregate([{"$group":{"_id":"$Area Name","count":{"$sum":1}}}])
jsonres=[]
for i in res:
	jsonres.append(i)
f=open('crimedataperarea.json','w')
f.write(json.dumps(jsonres))
f.close()
