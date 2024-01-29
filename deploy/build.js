import { $ } from "zx"


export async function build() {
    await $`cd /home/udo/houchi-calc`
    await $`git pull`
    await $`npm i`
    await $`npm run build`
    await $`cp -rf ./dist /var/www/html/deleste`
}
