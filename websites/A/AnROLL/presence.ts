import { Assets, getTimestamps } from 'premid'

const presence = new Presence({ clientId: '1395970198405644350' })

enum ActivityAssets {
  Logo = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/logo.png',
  Home = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/0.png',
  Calendar = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/1.png',
  Search = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/2.png',
  Profile = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/3.png',
  Films = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/4.png',
  Partyroll = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/5.png',
  Notes = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/6.png',
  VIP = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/7.png',
  Requests = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/8.png',
  ARPCoins = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/9.png',
  Account = 'https://cdn.rcd.gg/PreMiD/websites/A/AnROLL/assets/10.png',
}

const pageDetails: Record<string, { title: string, image?: string }> = {
  '': { title: 'Página Inicial', image: ActivityAssets.Home },
  'animes': { title: 'Procurando animes', image: ActivityAssets.Search },
  'calendario': { title: 'Calendário', image: ActivityAssets.Calendar },
  'perfil': { title: 'Perfil', image: ActivityAssets.Profile },
  'filmes': { title: 'Explorando filmes', image: ActivityAssets.Films },
  'party': { title: 'Partyroll', image: ActivityAssets.Partyroll },
  'notes': { title: 'Notas de atualização', image: ActivityAssets.Notes },
  'vip': { title: 'Área VIP', image: ActivityAssets.VIP },
  'pedidos': { title: 'Pedidos de animes', image: ActivityAssets.Requests },
  'arp': { title: 'ARPCoins', image: ActivityAssets.ARPCoins },
  'login': { title: 'Fazendo login' },
  'registrar': { title: 'Criando uma conta' },
}

interface VideoData {
  duration: number
  currentTime: number
  paused: boolean
}

let videoElement: HTMLVideoElement | null = null
let lastVideoState: VideoData | null = null
let checkInterval: number | null = null

function findAndTrackVideoState() {
  const findVideo = () => {
    const playerSelectors = ['#jwPlayer video', '#nativePlayer video', '#dplayer video', 'video[src^="blob:"]', 'video[src^="http"]']
    for (const selector of playerSelectors) {
      const video = document.querySelector<HTMLVideoElement>(selector)
      if (video && !Number.isNaN(video.duration) && video.duration > 0) {
        videoElement = video
        if (checkInterval === null) {
          checkInterval = window.setInterval(checkVideoState, 500)
        }
        return true
      }
    }
    return false
  }

  if (!findVideo()) {
    const findInterval = setInterval(() => {
      if (findVideo()) {
        clearInterval(findInterval)
      }
    }, 2000)
  }
}

function checkVideoState(): void {
  if (!videoElement || Number.isNaN(videoElement.duration))
    return
  lastVideoState = {
    currentTime: videoElement.currentTime,
    duration: videoElement.duration,
    paused: videoElement.paused,
  }
}

async function getCoverImage(): Promise<string> {
  const selectors = ['meta[property="og:image"]', '.sc-kpOvIu.ixIKbI', '.sc-e46cb5d2-5']
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector)
    if (element) {
      if (element.tagName === 'META') {
        return (element as HTMLMetaElement).content
      }
      if (element.tagName === 'IMG') {
        return (element as HTMLImageElement).src
      }
      const bgStyle = getComputedStyle(element)
      if (bgStyle.backgroundImage && bgStyle.backgroundImage !== 'none') {
        const match = bgStyle.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/i)
        if (match?.[1])
          return match[1]
      }
    }
  }
  return ActivityAssets.Logo
}

function getTitles(): { anime: string, episode: string } {
  const { pathname } = window.location
  const segment1 = pathname.split('/')[1]

  if (segment1 === 'a') {
    const animeTitle = document.querySelector('article.animedetails h2')?.textContent?.trim()
    return { anime: animeTitle || 'Navegando', episode: '' }
  }

  if (segment1 === 'e' || segment1 === 'watch') {
    const animeTitle = document.querySelector('#anime_title span, article.animedetails h2')?.textContent?.trim()
      || document.title.match(/Assistir (.*?)\s-/)?.[1]?.trim()
      || 'Anime'

    const episodeTitle = document.querySelector('h2#current_ep')?.textContent?.trim()?.replace(/\s+/g, ' ').trim()
      || document.title.match(/-\s(Episódio.*?)(?:\sOnline|\s- AnimesROLL)/)?.[1]?.trim()
      || 'Episódio'

    return { anime: animeTitle, episode: episodeTitle }
  }

  return { anime: 'Navegando no AnROLL', episode: '' }
}

presence.on('UpdateData', async () => {
  const { pathname, href } = document.location
  const [segment1 = ''] = pathname.split('/').filter(Boolean)

  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
  }

  try {
    const [privacyMode, showTimestamps, showCover, hideWhenPaused] = await Promise.all([
      presence.getSetting<boolean>('privacy'),
      presence.getSetting<boolean>('timestamps'),
      presence.getSetting<boolean>('cover'),
      presence.getSetting<boolean>('hideWhenPaused'),
    ])

    // PÁGINA DO ANIME (/a/...)
    if (segment1 === 'a') {
      const { anime } = getTitles()
      presenceData.details = anime // Apenas o nome do anime
      presenceData.startTimestamp = Math.floor(Date.now() / 1000)

      if (!privacyMode) {
        const firstEpisodeLink = document.querySelector<HTMLAnchorElement>('.itemlistepisode a')
        const watchUrl = firstEpisodeLink ? firstEpisodeLink.href.replace('/e/', '/watch/e/') : null

        presenceData.buttons = watchUrl
          ? [{ label: 'Ver Detalhes do Anime', url: href }, { label: 'Assistir 1º Episódio', url: watchUrl }]
          : [{ label: 'Ver Detalhes do Anime', url: href }]
      }
    }
    // PÁGINA DO EPISÓDIO (/e/...) E PLAYER (/watch/...)
    else if (segment1 === 'e' || segment1 === 'watch') {
      const { anime, episode } = getTitles()
      presenceData.details = anime // Nome do Anime
      presenceData.state = episode // Número e Título do Episódio

      if (segment1 === 'watch') {
        if (!checkInterval)
          findAndTrackVideoState()
        if (!lastVideoState) {
          presenceData.details = 'Carregando vídeo...'
          return presence.setActivity(presenceData)
        }
        if (lastVideoState.paused && hideWhenPaused)
          return presence.clearActivity()

        presenceData.smallImageKey = lastVideoState.paused ? Assets.Pause : Assets.Play
        presenceData.smallImageText = lastVideoState.paused ? 'Pausado' : 'Assistindo'

        if (showTimestamps && !lastVideoState.paused && lastVideoState.duration > 0) {
          const [startTimestamp, endTimestamp] = getTimestamps(Math.floor(lastVideoState.currentTime), Math.floor(lastVideoState.duration))
          presenceData.startTimestamp = startTimestamp
          presenceData.endTimestamp = endTimestamp
        }
      }
      else {
        presenceData.startTimestamp = Math.floor(Date.now() / 1000)
      }

      if (!privacyMode) {
        const playerUrl = segment1 === 'e' ? href.replace('/e/', '/watch/e/') : href
        const animePageLink = document.querySelector<HTMLAnchorElement>('#anime_title a')?.href ?? ''

        presenceData.buttons = animePageLink
          ? [{ label: segment1 === 'watch' ? 'Assistindo Agora' : 'Assistir Agora', url: playerUrl }, { label: 'Página do Anime', url: animePageLink }]
          : [{ label: segment1 === 'watch' ? 'Assistindo Agora' : 'Assistir Agora', url: playerUrl }]
      }
    }
    // OUTRAS PÁGINAS
    else if (pageDetails[segment1]) {
      presenceData.details = pageDetails[segment1].title
      if (pageDetails[segment1].image && showCover)
        presenceData.largeImageKey = pageDetails[segment1].image
      presenceData.startTimestamp = Math.floor(Date.now() / 1000)
    }
    else {
      presenceData.details = 'Navegando no AnROLL'
      presenceData.startTimestamp = Math.floor(Date.now() / 1000)
    }

    if (showCover && !privacyMode) {
      presenceData.largeImageKey = await getCoverImage()
    }

    if (privacyMode) {
      presenceData.details = 'Navegando no AnROLL'
      presenceData.state = 'Em modo privado'
      delete presenceData.buttons
      delete presenceData.startTimestamp
      delete presenceData.endTimestamp
      presenceData.largeImageKey = ActivityAssets.Logo
    }

    presence.setActivity(presenceData)
  }
  catch (error) {
    console.error('Erro ao atualizar a Presence:', error)
    presence.clearActivity()
  }
})
