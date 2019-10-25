import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import moment from 'moment'
import MomentUtils from '@date-io/moment'
import Button from '@material-ui/core/Button'
import Img from 'react-image'
import { useWindowSize, usePrevious } from './util'
import './App.css'
import {
  Icon,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  Hidden,
  Avatar,
  IconButton,
  Fab
} from '@material-ui/core'
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import 'moment/locale/es'

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

const buscarDolares = async (desdeFecha, setDolares, hoy) => {
  const memoria = localStorage.getItem('dolares')
  if (memoria) {
    const verdes = JSON.parse(memoria)
    setDolares(verdes)
    return
  }

  const desde = desdeFecha.format(formatoGuion)
  const hasta = hoy.format(formatoGuion)
  const url = `https://mercados.ambito.com//dolar/oficial/historico-general/${desde}/${hasta}`
  const pedido = await fetch(url)
  const json = await pedido.json()
  const limpia = json
    .filter((_, i) => i > 0)
    .reduce((acc, item) => ({ ...acc, [item[0]]: item }), {})
  localStorage.setItem('dolares', JSON.stringify(limpia))
  setDolares(limpia)
}

export default () => {
  const [dp, setDP] = useState(false)
  const intervalo = useRef()
  const { current: desde } = useRef(moment(fechaInicial, formatoBarra))
  const { current: hoy } = useRef(moment())
  const { current: diff } = useRef(hoy.diff(desde, 'days'))
  const [reproduciendo, setReproducir] = useState(false)
  const [actual, setActual] = useState(0)
  const [dolares, setDolares] = useState()
  const { height } = useWindowSize()
  const alturaTapa = useMemo(() => height - 120, [height])
  const anterior = useCallback(
    (cuanto) =>
      setActual((actual) => (actual - cuanto > 0 ? actual - cuanto : 0)),
    []
  )

  const siguiente = useCallback(
    (cuanto) =>
      setActual((actual) => (actual + cuanto < diff ? actual + cuanto : diff)),
    [diff]
  )

  useEffect(() => {
    document.onkeydown = ({ keyCode }) => {
      switch (keyCode) {
        case 33:
          anterior(30)
          return
        case 34:
          siguiente(30)
          return
        case 37:
          anterior(1)
          return
        case 39:
          siguiente(1)
          return
        default:
          return
      }
    }
  }, [anterior, diff, siguiente])

  useEffect(() => {
    buscarDolares(desde, setDolares, hoy)
  }, [desde, hoy])

  const { tapas, fecha, fechaBarra, fechaGuion, salario } = useMemo(() => {
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
      fecha,
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
    const usar = venta || ventaAnterior
    if (!usar) return

    const ventaFloat = parseFloat(usar.replace(/,/g, '.'))
    const dif = (salario.pesos / ventaFloat).toFixed(2)
    return dif
  }, [salario.pesos, venta, ventaAnterior])
  const anteriorDolares = usePrevious(salarioDolares)

  const renderButton = useCallback(
    (dias, que) => {
      let final = dias < 0 ? dias * -1 : dias
      if (que === 'month') {
        final = fecha.daysInMonth()
      }
      return (
        <Button
          style={{ margin: 8 }}
          variant="contained"
          color="primary"
          onClick={() => (dias < 0 ? anterior(final) : siguiente(final))}>
          {dias < 0 ? final : '+' + final} {final === 1 ? 'Día' : 'Días'}
        </Button>
      )
    },
    [anterior, fecha, siguiente]
  )

  const reproducirCall = useCallback(() => {
    setReproducir((reproduciendo) => {
      if (reproduciendo) {
        clearInterval(intervalo.current)
        return false
      }

      intervalo.current = setInterval(() => {
        if (actual < diff) {
          siguiente(1)
        } else {
          clearInterval(intervalo.current)
        }
      }, 1500)
      return true
    })
  }, [actual, diff, intervalo, siguiente])

  const renderTexto = useCallback(() => {
    const variacion = salarioDolares - anteriorDolares

    return (
      <Grid
        container
        item
        xs={10}
        direction="column"
        style={{ position: 'relative' }}>
        <Avatar
          style={{
            position: 'absolute',
            right: 20,
            alignItems: 'center',
            backgroundColor:
              variacion === 0 ? 'grey' : variacion > 0 ? 'green' : 'red',
            marginLeft: 8
          }}>
          {variacion !== 0 ? (
            <Icon>{variacion > 0 ? 'arrow_upward' : 'arrow_downward'}</Icon>
          ) : (
            '='
          )}
        </Avatar>
        <Grid container direction="row" alignItems="center">
          <Typography>
            Salario Mínimo: <b>${salario.pesos}</b> -{' '}
            <b>U$S {salarioDolares}</b>
          </Typography>
        </Grid>
        <Grid>
          <Typography>
            Dolar (Venta): <b>{venta || ventaAnterior}</b>
          </Typography>
        </Grid>
      </Grid>
    )
  }, [anteriorDolares, salario.pesos, salarioDolares, venta, ventaAnterior])

  if (!dolares) {
    return (
      <div>
        <p>Cargando</p>
      </div>
    )
  }

  return (
    <>
      <MuiPickersUtilsProvider libInstance={moment} utils={MomentUtils}>
        <Grid container justify="center" style={{ marginTop: 8, flexGrow: 1 }}>
          <Grid
            style={{ position: 'relative' }}
            justify="center"
            alignItems="center"
            container
            item
            direction="row">
            {dp && (
              <div style={{ zIndex: 500, position: 'absolute', top: 50 }}>
                <DatePicker
                  minDate={desde}
                  maxDate={moment()}
                  value={fecha}
                  variant={'static'}
                  orientation="landscape"
                  onChange={(date, asd, asd2) =>
                    setActual(date.diff(desde, 'days'))
                  }
                />
              </div>
            )}
            <Typography>
              Fecha: <b>{fechaBarra}</b>
            </Typography>
            <IconButton onClick={() => setDP((d) => !d)} color="primary">
              <Icon>date_range</Icon>
            </IconButton>
          </Grid>
          <Grid container justify="center" item>
            <Grid item md={1}>
              {renderButton(-1, 'month')}
            </Grid>
            <Grid item md={1}>
              {renderButton(-1)}
            </Grid>
            <Hidden mdDown>
              <Grid item md={4}>
                {renderTexto()}
              </Grid>
            </Hidden>
            <Grid item md={1}>
              {renderButton(1)}
            </Grid>
            <Grid item md={1}>
              {renderButton(1, 'month')}
            </Grid>
          </Grid>
          <Hidden smUp>
            <Grid container justify="center" item xs={12} md={12}>
              {renderTexto()}
            </Grid>
          </Hidden>
          <Grid container item spacing={2} xs={12} md={10}>
            {tapas.map((props) => (
              <Grid item xs={12} md={4} key={props}>
                <Paper
                  onClick={() => window.open(props, '_blank')}
                  style={{ alignItems: 'center' }}>
                  <Img
                    alt={props}
                    style={{
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                    key={props}
                    src={props}
                    unloader={
                      <div
                        style={{
                          maxWidth: '100%',
                          height: 'auto'
                        }}>
                        No se encontró la tapa
                      </div>
                    }
                    loader={<CircularProgress />}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Fab
          onClick={reproducirCall}
          variant="extended"
          style={{
            margin: 0,
            top: 'auto',
            right: 20,
            bottom: 20,
            left: 'auto',
            position: 'fixed'
          }}>
          <Icon>{reproduciendo ? 'pause' : 'play_arrow'}</Icon>
          {reproduciendo ? 'Pausar' : 'Reproducir'}
        </Fab>
      </MuiPickersUtilsProvider>
    </>
  )
}
