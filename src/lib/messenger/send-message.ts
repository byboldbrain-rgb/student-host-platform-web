type MessengerQuickReply = {
  content_type: 'text'
  title: string
  payload: string
}

type SendMessengerTextOptions = {
  quickReplies?: MessengerQuickReply[]
}

export async function sendMessengerText(
  psid: string,
  text: string,
  options?: SendMessengerTextOptions
) {
  const pageAccessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN

  if (!pageAccessToken) {
    throw new Error('Missing MESSENGER_PAGE_ACCESS_TOKEN')
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/me/messages?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: {
          id: psid,
        },
        messaging_type: 'RESPONSE',
        message: {
          text,
          ...(options?.quickReplies?.length
            ? {
                quick_replies: options.quickReplies,
              }
            : {}),
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Messenger send failed: ${errorText}`)
  }

  return response.json()
}