/* eslint-disable */
server.on('beforeSortPosts', posts => {
    posts.forEach(post => {
        let frontDate = post.matter.date
        if (typeof frontDate !== 'undefined') {
            post.originDate = formatDate(frontDate)
            return
        }
        post.originDate = formatDate(post.originDate)
        post.updatedDate = formatDate(post.updatedDate)
    })
})

function formatDate(d) {
    let slice = new Date(d).toLocaleDateString('zh-CN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Shanghai',
    }).split('/');
    return `${slice[2]}-${slice[0]}-${slice[1]}`;
}