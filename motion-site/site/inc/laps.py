def laps(done):
    names=['Apply','Business questionnaire','Book your call','Your Fast Track Call']
    out='<div class="ft-laps" data-stagger>@INC:/tmp/site/inc/car.svg@'
    for i,n in enumerate(names):
        cls='done' if i<done else ('here' if i==done else '')
        sym='&#10003;' if i<done else ('&#9742;' if i==3 else f'0{i+1}')
        out+=f'<div class="{cls}"><b>{sym}</b><span>Lap 0{i+1}</span><strong>{n}</strong></div>'
    return out+'</div>'
