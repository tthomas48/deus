# Dues Tech Code: Based upon Twilio votr app

curl -X PUT $HOST/events

curl -X PUT $HOST/_config/admins/username -d '"password"'

curl -X PUT $HOST/events/_design/event -d @models/event_views.json

# example of submitting votes manually (for dev test):
curl -X POST $HOST/vote/sms?To=%2B15555555555&From=%2B5551234567&Body=1
* NOTE: the To phone number should match the phone number of a Cue which is currently enabled (State = on)