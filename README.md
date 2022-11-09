`node index.js` to run proxy for Search project, and composer point to production data

`node index.js --composer=1215` to run proxy for Search project, and composer point to 1215 metasearcher

`node index.js --project=edu` to run proxy for Edu project, and composer point to production data.

`node index.js --project=@ --composer=@` to select specific `project` and `composer` port.

### Add cert to your browser - for non Coc Coc browser

If you are not using Coc Coc browser, let's do one more step to make proxy work.

After runing proxy, you will see a folder named `certs`, let's add `ca.pem` file in this folder to your browser.

How to add cert to browser, please search by yourself. Gook luck!!!
