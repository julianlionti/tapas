import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import './App.css'
import moment from 'moment'

const url = 'http://localhost:3000/'

const useWindowSize = () => {
  const isClient = typeof window === 'object'

  const getSize = useCallback(
    () => ({
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined
    }),
    [isClient]
  )

  const [windowSize, setWindowSize] = useState(getSize)

  useEffect(() => {
    if (!isClient) {
      return false
    }

    function handleResize() {
      setWindowSize(getSize())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getSize, isClient]) // Empty array ensures that effect is only run on mount and unmount

  return windowSize
}

const primerFecha = async (setDiferencia, setDesde) => {
  // const primera = await fetch(`${url}primera`)
  // const { desde } = await primera.json()

  const desdeFecha = moment('10/12/2015', 'DD/MM/YYYY')
  setDesde(desdeFecha)
  const hoyFecha = moment()
  const diferenciaEnDias = hoyFecha.diff(desdeFecha, 'days') + 1
  setDiferencia(diferenciaEnDias)
}

const desarmar = (fecha) => {
  let dia = fecha.get('D')
  let mes = fecha.get('M') + 1
  const año = fecha.get('y')
  if (mes.toString().length === 1) {
    mes = '0' + mes
  }
  if (dia.toString().length === 1) {
    dia = '0' + dia
  }
  return { dia, mes, año }
}

function App() {
  const intervalo = useRef()
  const [desde, setDesde] = useState()
  const [actual, setActual] = useState(0)
  const [diferencia, setDiferencia] = useState()
  const { height } = useWindowSize()

  const atrasar = useCallback(
    () => setActual((actual) => (actual > 0 ? actual - 1 : 0)),
    []
  )

  const adelantar = useCallback(
    () =>
      setActual((actual) => (actual < diferencia ? actual + 1 : diferencia)),
    [diferencia]
  )

  useEffect(() => {
    primerFecha(setDiferencia, setDesde)
  }, [])

  useEffect(() => {
    document.onkeydown = ({ keyCode }) => {
      switch (keyCode) {
        case 37:
          atrasar()
          return
        case 39:
          adelantar()
          return
        default:
          return
      }
    }
  }, [adelantar, atrasar, diferencia])

  const diarios = useMemo(() => {
    const diarios = ['pagina12', 'clarin']
    const actualFecha = desde && desde.clone().add(actual, 'day')
    if (actualFecha) {
      const { año, mes, dia } = desarmar(actualFecha)
      return {
        hoy: actualFecha.format('DD/MM/YYYY'),
        diarios: diarios.map((diario) =>
          año >= 2018
            ? `http://img.kiosko.net/${año}/${mes}/${dia}/ar/ar_${diario}.750.jpg`
            : `http://a${año}.kiosko.net/${mes}/${dia}/ar/ar_${diario}.jpg`
        )
      }
    }
    return {}
  }, [actual, desde])

  useEffect(() => {
    if (diferencia) {
      // intervalo.current = setInterval(() => adelantar(), 1500)
    }
  }, [adelantar, diferencia])

  useEffect(() => {
    if (diferencia === actual) {
      clearInterval(intervalo.current)
    }
  }, [actual, diferencia])

  if (!desde) return <p>Cargando</p>

  return (
    <>
      <p style={{ textAlign: 'center' }}>{diarios.hoy}</p>
      <div className="App">
        {diarios.diarios &&
          diarios.diarios.map((props) => (
            <img
              key={props}
              alt="clarin"
              style={{ width: 'auto', height: height - 70 }}
              src={props}
            />
          ))}
      </div>
    </>
  )
}

export default App
