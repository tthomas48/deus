# Dues Tech Code: Based upon Twilio votr app

curl -X PUT $HOST/events

curl -X PUT $HOST/_config/admins/username -d '"password"'

# to load the data views (for initial setup, and whenever it's updated):
curl -X PUT $HOST/events/_design/event -d @models/event_views.json
* NOTE: if you get a Document update conflict, you will need to update the _rev value in event_views.json
* you can retrieve the current value by running:
curl -X GET $HOST/events/_design/event                                                                                                    

# example of submitting votes manually (for dev test):
curl -X POST $HOST/vote/sms?To=%2B15555555555&From=%2B5551234567&Body=1
* NOTE: the To phone number should match the phone number of a Cue which is currently enabled (State = on)