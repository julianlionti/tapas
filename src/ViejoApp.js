import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import './App.css'
import moment from 'moment'
import ImageLoader from 'react-load-image'
import logo from './logo.svg'

const SMVM = [
  { desde: '01/08/2015', pesos: 5588, USS: 601.5 },
  { desde: '01/01/2016', pesos: 6060, USS: 435.97 },
  { desde: '01/06/2016', pesos: 6810, USS: 456.43 },
  { desde: '01/09/2016', pesos: 7560, USS: 497.37 },
  { desde: '01/01/2017', pesos: 8060, USS: 506.55 },
  { desde: '01/06/2017', pesos: 8860, USS: 501.41 },
  { desde: '01/01/2018', pesos: 10000, USS: 346.48 },
  { desde: '01/09/2018', pesos: 11300, USS: 297.36 },
  { desde: '01/03/2019', pesos: 12500, USS: 299.68 },
  { desde: '01/08/2019', pesos: 14125, USS: 242 },
  { desde: '01/09/2019', pesos: 15625, USS: 268 },
  { desde: '01/10/2019', pesos: 16875, USS: 289 }
]

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

const buscarDolar = async (fecha, setDolar) => {
  //28-12-18
  // https://mercados.ambito.com//dolar/oficial/historico-general/25-09-2015/05-10-2015
  const desde = fecha.format('DD-MM-YYYY')
  const hasta = fecha
    .clone()
    .add(30, 'days')
    .format('DD-MM-YYYY')
  console.log(
    `https://mercados.ambito.com//dolar/oficial/historico-general/${desde}/${hasta}`
  )
  const pedido = await fetch(
    `https://mercados.ambito.com//dolar/oficial/historico-general/${desde}/${hasta}`
  )
  const json = await pedido.json()
  setDolar(
    json
      .filter((_, i) => i > 0)
      .reduce((acc, item) => ({ ...acc, [item[0]]: item }), {})
  )
}

function App() {
  const intervalo = useRef()
  const [dolar, setDolar] = useState()
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
    const diarios = ['ar_clarin', 'ar_pagina12', 'nacion']
    const actualFecha = desde && desde.clone().add(actual, 'day')
    if (actualFecha) {
      var dates = SMVM.map((s, i) => ({
        diff: actualFecha.diff(moment(s.desde, 'DD/MM/YYYY'), 'days'),
        i
      }))
        .filter((a) => a.diff >= 0)
        .sort((a, b) => a.diff - b.diff)

      const [SMVMActual] = dates
      const salario = SMVM[SMVMActual.i]

      // buscarDolar(actualFecha, setDolar)

      const { año, mes, dia } = desarmar(actualFecha)
      return {
        hoy: actualFecha,
        salario,
        diarios: diarios.map((diario) =>
          año >= 2018
            ? `http://img.kiosko.net/${año}/${mes}/${dia}/ar/${diario}.750.jpg`
            : `http://a${año}.kiosko.net/${mes}/${dia}/ar/${diario}.jpg`
        )
      }
    }
    return {}
  }, [actual, desde])

  useEffect(() => {
    if (diferencia) {
      // intervalo.current = setInterval(() => adelantar(), 2500)
    }
  }, [adelantar, diferencia])

  useEffect(() => {
    if (diferencia === actual) {
      clearInterval(intervalo.current)
    }
  }, [actual, diferencia])

  const dolarActual = useMemo(() => {
    if (!dolar) {
      if (diarios.hoy) {
        buscarDolar(diarios.hoy, setDolar)
      }
      return {}
    }

    const valores = dolar[diarios.hoy.format('DD-MM-YYYY')]
    if (!valores) {
      buscarDolar(diarios.hoy, setDolar)
      return {}
    }
    const [_, compra, venta] = valores
    return { leyenda: `Compra: ${compra} - Venta: ${venta}`, venta }
  }, [diarios, dolar])

  if (!desde) return <p>Cargando</p>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-around', flex: 1 }}>
        <p>Fecha: {diarios.hoy.format('DD/MM/YYYY')}</p>
        {diarios.salario && (
          <>
            <p>{`Salario Minimo: $${diarios.salario.pesos} - U$S: ${(
              diarios.salario.pesos / dolarActual.venta
            ).toFixed(2)}`}</p>
            <p>{`Dolar: ${dolarActual.leyenda}`}</p>
          </>
        )}
      </div>
      <div className="App">
        {diarios.diarios &&
          diarios.diarios.map((props) => (
            <ImageLoader key={props} src={props}>
              <img alt={props} style={{ width: 'auto', height: height - 70 }} />
              <div>Error!</div>
              <p>Cargando</p>
              {/* <img src={logo} className="App-logo" alt="logo" />; */}
            </ImageLoader>
          ))}
      </div>
    </>
  )
}

export default App
