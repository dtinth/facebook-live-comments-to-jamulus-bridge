const config = require('./config');
const url = `https://graph.facebook.com/v12.0/me/live_videos?broadcast_status=["LIVE"]&fields=id,live_views,comments.filter(stream).order(reverse_chronological).live_filter(no_filter),video{id}&access_token=${config.accessToken}`

const axios = require('axios').default;
const jayson = require('jayson/promise')
const jamulusServer = new jayson.client.tcp({ host: '127.0.0.1', port: 22222 })
const jamulusClient = new jayson.client.tcp({ host: '127.0.0.1', port: 22100 })
const fs = require('fs')
const _ = require('lodash')

if (!fs.existsSync('posted')) {
  fs.mkdirSync('posted')
}

async function main () {
  const response = await axios.get(url)
  const {data: [{ live_views, comments: {data:comments}, video }]} = response.data
  
  comments.sort((a, b) => a.created_time < b.created_time ? -1 : 1)

  const name = 'FacebookLive[' + live_views + ']'
  jamulusClient.request('jamulusclient/setName', { name })
    .then(resp => console.log('Client name set to', name))
    .catch(error => console.error(error))

  for (const comment of comments) {
    const postedFile = 'posted/' + comment.id + '.json'
    if (!fs.existsSync(postedFile)) {
      const now = new Date().toString().split(' ')[4]
      const userName = comment.from?.name
      const user = userName ? _.escape(` [${userName}]`) : ''
      const chatTextHtml = `(${now}) <strong><a href="https://www.facebook.com/${video.id}">Facebook Live Comment</a>${user}:</strong> ${_.escape(comment.message)}`
      const result = await jamulusServer.request('jamulusserver/broadcastChatText', { chatTextHtml })
      console.log(result)
      fs.writeFileSync(postedFile, JSON.stringify(comment, null, 2))
    } else {
      console.log('Already posted: ' + comment.id)
    }
  }
}

main()
