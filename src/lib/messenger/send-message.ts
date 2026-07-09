type MessengerQuickReply = {
  content_type: 'text'
  title: string
  payload: string
}

type SendMessengerTextOptions = {
  quickReplies?: MessengerQuickReply[]
}

type MessengerPostbackButton = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerWebUrlButton = {
  type: 'web_url'
  title: string
  url: string
}

type MessengerButton = MessengerPostbackButton | MessengerWebUrlButton

type SendMessengerButtonsOptions = {
  buttons: MessengerButton[]
}

function getMessengerPageAccessToken() {
  const pageAccessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN

  if (!pageAccessToken) {
    throw new Error('Missing MESSENGER_PAGE_ACCESS_TOKEN')
  }

  return pageAccessToken
}

export async function sendMessengerText(
  psid: string,
  text: string,
  options?: SendMessengerTextOptions
) {
  const pageAccessToken = getMessengerPageAccessToken()

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

export async function sendMessengerButtons(
  psid: string,
  text: string,
  options: SendMessengerButtonsOptions
) {
  const pageAccessToken = getMessengerPageAccessToken()

  const buttons = options.buttons.slice(0, 3).map((button) => {
    if (button.type === 'web_url') {
      return {
        type: 'web_url',
        title: button.title,
        url: button.url,
      }
    }

    return {
      type: 'postback',
      title: button.title,
      payload: button.payload,
    }
  })

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
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text,
              buttons,
            },
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Messenger buttons send failed: ${errorText}`)
  }

  return response.json()
}