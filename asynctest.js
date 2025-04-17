

async function asyncfn(n) {
    let timer = setTimeout(() => {
        console.log(`Async Timer!: ${n}`)
    }, 1000)
}

sleep

function fn(n) {
    let timer = setTimeout(() => {
        console.log(`Sync Timer!: ${n}`)
    }, 1000)
}

for (let i=0; i<10; i++) {
    asyncfn(i);
}

for (let i=0; i<10; i++) {
    fn(i);
}
