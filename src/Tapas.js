import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import moment from 'moment'
import ImageLoader from 'react-load-image'
import { useWindowSize, usePrevious } from './util'
import './App.css'

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

const diarios = ['ar_clarin', 'ar_pagina12', 'nacion']

const fechaInicial = '10/12/2015'

const formatoBarra = 'DD/MM/YYYY'
const formatoGuion = 'DD-MM-YYYY'

const buscarDolares = async (desdeFecha, setDolares) => {
  const desde = desdeFecha.format(formatoGuion)
  const hasta = moment().format(formatoGuion)
  const url = `https://mercados.ambito.com//dolar/oficial/historico-general/${desde}/${hasta}`
  const pedido = await fetch(url)
  const json = await pedido.json()
  const limpia = json
    .filter((_, i) => i > 0)
    .reduce((acc, item) => ({ ...acc, [item[0]]: item }), {})
  setDolares(limpia)
}

export default () => {
  const { current: desde } = useRef(moment(fechaInicial, formatoBarra))
  const { current: diff } = useRef(moment().diff(desde, 'days'))
  const [actual, setActual] = useState(0)
  const [dolares, setDolares] = useState()
  const { height } = useWindowSize()

  useEffect(() => {
    document.onkeydown = ({ keyCode }) => {
      switch (keyCode) {
        case 33:
          setActual((actual) => (actual - 30 > 0 ? actual - 30 : 0))
          return
        case 34:
          setActual((actual) => (actual + 30 < diff ? actual + 30 : diff))
          return
        case 37:
          setActual((actual) => (actual > 0 ? actual - 1 : 0))
          return
        case 39:
          setActual((actual) => (actual < diff ? actual + 1 : diff))
          return
        default:
          return
      }
    }
  }, [diff])

  useEffect(() => {
    buscarDolares(desde, setDolares)
  }, [desde])

  const { tapas, fechaBarra, fechaGuion, salario } = useMemo(() => {
    const fecha = desde.clone().add(actual, 'days')

    var dates = SMVM.map((s, i) => ({
      diff: fecha.diff(moment(s.desde, formatoBarra), 'days'),
      i
    }))
      .filter((a) => a.diff >= 0)
      .sort((a, b) => a.diff - b.diff)

    const [SMVMActual] = dates
    const salario = SMVM[SMVMActual.i]

    let dia = fecha.get('D')
    let mes = fecha.get('M') + 1
    const año = fecha.get('y')
    if (mes.toString().length === 1) {
      mes = '0' + mes
    }
    if (dia.toString().length === 1) {
      dia = '0' + dia
    }

    return {
      fechaBarra: fecha.format(formatoBarra),
      fechaGuion: fecha.format(formatoGuion),
      salario,
      tapas: diarios.map((diario) =>
        año >= 2018
          ? `http://img.kiosko.net/${año}/${mes}/${dia}/ar/${diario}.750.jpg`
          : `http://a${año}.kiosko.net/${mes}/${dia}/ar/${diario}.jpg`
      )
    }
  }, [actual, desde])

  const { compra, venta } = useMemo(() => {
    if (!dolares) return {}
    const valores = dolares[fechaGuion]
    if (valores) {
      const [_, compra, venta] = valores
      return { compra, venta }
    }
    return {}
  }, [dolares, fechaGuion])
  const ventaAnterior = usePrevious(venta)

  const salarioDolares = useMemo(() => {
    if (!venta || !ventaAnterior) return
    const usar = venta || ventaAnterior
    const ventaFloat = parseFloat(usar.replace(/,/g, '.'))
    const dif = (salario.pesos / ventaFloat).toFixed(2)
    return dif
  }, [salario.pesos, venta, ventaAnterior])

  if (!dolares) {
    return <p>Cargando</p>
  }

  return (
    <>
      <div className="Textos">
        <p style={{ padding: 8 }}>Fecha: {fechaBarra}</p>
        <p style={{ padding: 8 }}>
          Salario Mínimo: ${salario.pesos} - U$S {salarioDolares}
        </p>
        <p style={{ padding: 8 }}>Dolar: {venta || ventaAnterior}</p>
      </div>
      <div className="Tapas">
        {tapas.map((props) => (
          <ImageLoader key={props} src={props}>
            <img alt={props} style={{ width: 'auto', height: height - 85 }} />
            <div>Error!</div>
            <p>Cargando</p>
            {/* <img src={logo} className="App-logo" alt="logo" />; */}
          </ImageLoader>
        ))}
      </div>
    </>
  )
}
