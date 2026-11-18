insert into maintenance_requests(user_id,category_id,title,description,building,unit,priority,status,created_at)
select p.id,c.id,v.t,v.d,'Building A',v.u,v.pr,v.s,now()-(v.days||' days')::interval
from (select id from profiles where role='resident' order by created_at limit 1) p
cross join (values
 ('Plumbing','Kitchen water leakage','Water under the sink','204','High','Submitted',1),
 ('AC','AC stopped cooling','Unit blows warm air','110','Medium','Under Review',2),
 ('Electrical','Bedroom outlet not working','No power in one outlet','312','Urgent','In Progress',3),
 ('Carpentry','Front door will not close','Hinge is loose','204','Low','Resolved',6),
 ('General','Hallway light flickering','Third floor','3F','Low','Closed',9),
 ('Plumbing','Bathroom tap dripping','Constant drip','118','Medium','Waiting for Parts',4)
) as v(cat,t,d,u,pr,s,days)
join maintenance_categories c on c.name=v.cat;
