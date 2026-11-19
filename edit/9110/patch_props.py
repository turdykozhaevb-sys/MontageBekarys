import json
p='edit/9110/reelkit-props.json'; d=json.load(open(p))
m={'Дұстар,':'Достар,','харашы,':'қараша,','21.':'21','.00-ді.':'.00-де.','Жаңузияң':'Жаңаөзен','ғаласында':'қаласында'}
def walk(o):
    if isinstance(o,dict):
        if 'text' in o and o['text'] in m: o['text']=m[o['text']]
        for v in o.values(): walk(v)
    elif isinstance(o,list):
        for v in o: walk(v)
walk(d); d['popSubs']=True; d['subtitles']='none'
json.dump(d,open(p,'w'),ensure_ascii=False)
