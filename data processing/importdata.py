import csv
from pymongo import MongoClient
client = MongoClient()
db = client.crime
f=open('Crime_Data_from_2010_to_Present.csv')
csvreader=csv.DictReader(f)
for row in csvreader:
	db.crimedata.insert_one(row)