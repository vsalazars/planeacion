--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-12-15 22:12:00 CST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 174519)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 4276 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 898 (class 1247 OID 174318)
-- Name: planeacion_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.planeacion_status AS ENUM (
    'borrador',
    'en_progreso',
    'finalizada',
    'archivada'
);


--
-- TOC entry 901 (class 1247 OID 174328)
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'profesor'
);


--
-- TOC entry 238 (class 1255 OID 174333)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 174334)
-- Name: planeacion_datos_generales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeacion_datos_generales (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    asignatura character varying(255),
    periodo character varying(50),
    grupo character varying(50),
    proposito text,
    metodologia text,
    consideraciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fecha_elaboracion date,
    programa_academico character varying(255),
    plan_estudios_anio integer,
    semestre_nivel character varying(50),
    creditos_tepic numeric(5,2),
    creditos_satca numeric(5,2),
    grupos character varying(255),
    area_formacion character varying(100),
    modalidad character varying(50),
    semanas_por_semestre integer,
    sesiones_por_semestre integer,
    sesiones_aula integer,
    sesiones_laboratorio integer,
    sesiones_clinica integer,
    sesiones_otro integer,
    horas_teoria numeric(5,2),
    horas_practica numeric(5,2),
    horas_aula numeric(5,2),
    horas_laboratorio numeric(5,2),
    horas_clinica numeric(5,2),
    horas_otro numeric(5,2),
    horas_total numeric(5,2),
    docente_autor character varying(255),
    academia character varying(255)
);


--
-- TOC entry 219 (class 1259 OID 174341)
-- Name: planeacion_datos_generales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planeacion_datos_generales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4277 (class 0 OID 0)
-- Dependencies: 219
-- Name: planeacion_datos_generales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planeacion_datos_generales_id_seq OWNED BY public.planeacion_datos_generales.id;


--
-- TOC entry 220 (class 1259 OID 174342)
-- Name: planeacion_organizacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeacion_organizacion (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    proposito text,
    estrategia text,
    metodos text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 174349)
-- Name: planeacion_organizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planeacion_organizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4278 (class 0 OID 0)
-- Dependencies: 221
-- Name: planeacion_organizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planeacion_organizacion_id_seq OWNED BY public.planeacion_organizacion.id;


--
-- TOC entry 222 (class 1259 OID 174350)
-- Name: planeacion_plagio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeacion_plagio (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    acepta_plagio boolean DEFAULT false NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ithenticate boolean DEFAULT false NOT NULL,
    turnitin boolean DEFAULT false NOT NULL,
    otro text
);


--
-- TOC entry 223 (class 1259 OID 174360)
-- Name: planeacion_plagio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planeacion_plagio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4279 (class 0 OID 0)
-- Dependencies: 223
-- Name: planeacion_plagio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planeacion_plagio_id_seq OWNED BY public.planeacion_plagio.id;


--
-- TOC entry 224 (class 1259 OID 174361)
-- Name: planeacion_referencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeacion_referencias (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    cita_apa text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unidades_aplica integer[],
    tipo character varying(30)
);


--
-- TOC entry 225 (class 1259 OID 174368)
-- Name: planeacion_referencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planeacion_referencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4280 (class 0 OID 0)
-- Dependencies: 225
-- Name: planeacion_referencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planeacion_referencias_id_seq OWNED BY public.planeacion_referencias.id;


--
-- TOC entry 226 (class 1259 OID 174369)
-- Name: planeacion_relaciones_ejes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeacion_relaciones_ejes (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    eje_disciplinar text,
    eje_transversal text,
    competencias text,
    resultados_aprendizaje text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    antecedentes text,
    laterales text,
    subsecuentes text,
    ejes_compromiso_social_sustentabilidad text,
    ejes_perspectiva_genero text,
    ejes_internacionalizacion text
);


--
-- TOC entry 227 (class 1259 OID 174376)
-- Name: planeacion_relaciones_ejes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planeacion_relaciones_ejes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4281 (class 0 OID 0)
-- Dependencies: 227
-- Name: planeacion_relaciones_ejes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planeacion_relaciones_ejes_id_seq OWNED BY public.planeacion_relaciones_ejes.id;


--
-- TOC entry 228 (class 1259 OID 174377)
-- Name: planeaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planeaciones (
    id bigint NOT NULL,
    docente_id integer NOT NULL,
    unidad_academica_id integer NOT NULL,
    nombre_planeacion character varying(255) NOT NULL,
    asignatura character varying(255),
    periodo character varying(50),
    grupo character varying(50),
    status public.planeacion_status DEFAULT 'borrador'::public.planeacion_status NOT NULL,
    secciones_completas jsonb DEFAULT '{"datos": false, "plagio": false, "relaciones": false, "referencias": false, "organizacion": false}'::jsonb NOT NULL,
    finalizada_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    slug text
);


--
-- TOC entry 229 (class 1259 OID 174386)
-- Name: planeaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planeaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4282 (class 0 OID 0)
-- Dependencies: 229
-- Name: planeaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planeaciones_id_seq OWNED BY public.planeaciones.id;


--
-- TOC entry 230 (class 1259 OID 174387)
-- Name: sesiones_didacticas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesiones_didacticas (
    id bigint NOT NULL,
    unidad_tematica_id bigint NOT NULL,
    numero_sesion integer NOT NULL,
    temas_subtemas text,
    actividades text,
    valor_porcentual integer,
    evidencia text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    actividades_inicio text,
    actividades_desarrollo text,
    actividades_cierre text,
    recursos text[],
    evidencias text[],
    instrumentos text[]
);


--
-- TOC entry 231 (class 1259 OID 174394)
-- Name: sesiones_didacticas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sesiones_didacticas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4283 (class 0 OID 0)
-- Dependencies: 231
-- Name: sesiones_didacticas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sesiones_didacticas_id_seq OWNED BY public.sesiones_didacticas.id;


--
-- TOC entry 232 (class 1259 OID 174395)
-- Name: unidades_academicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_academicas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    abreviatura character varying(50)
);


--
-- TOC entry 233 (class 1259 OID 174398)
-- Name: unidades_academicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unidades_academicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4284 (class 0 OID 0)
-- Dependencies: 233
-- Name: unidades_academicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unidades_academicas_id_seq OWNED BY public.unidades_academicas.id;


--
-- TOC entry 234 (class 1259 OID 174399)
-- Name: unidades_tematicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_tematicas (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    numero integer NOT NULL,
    nombre_unidad_tematica character varying(255) NOT NULL,
    horas integer,
    sesiones_por_espacio integer,
    sesiones_totales integer,
    porcentaje integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unidad_competencia text,
    periodo_del date,
    periodo_al date,
    horas_aula numeric(5,2),
    horas_laboratorio numeric(5,2),
    horas_taller numeric(5,2),
    horas_clinica numeric(5,2),
    horas_otro numeric(5,2),
    sesiones_aula integer,
    sesiones_laboratorio integer,
    sesiones_taller integer,
    sesiones_clinica integer,
    sesiones_otro integer,
    periodo_registro_eval character varying(100),
    aprendizajes_esperados text[],
    precisiones text
);


--
-- TOC entry 235 (class 1259 OID 174406)
-- Name: unidades_tematicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unidades_tematicas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4285 (class 0 OID 0)
-- Dependencies: 235
-- Name: unidades_tematicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unidades_tematicas_id_seq OWNED BY public.unidades_tematicas.id;


--
-- TOC entry 236 (class 1259 OID 174407)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    unidad_id integer NOT NULL,
    nombre_completo character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'profesor'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 174416)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4286 (class 0 OID 0)
-- Dependencies: 237
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4018 (class 2604 OID 174417)
-- Name: planeacion_datos_generales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_datos_generales ALTER COLUMN id SET DEFAULT nextval('public.planeacion_datos_generales_id_seq'::regclass);


--
-- TOC entry 4021 (class 2604 OID 174418)
-- Name: planeacion_organizacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_organizacion ALTER COLUMN id SET DEFAULT nextval('public.planeacion_organizacion_id_seq'::regclass);


--
-- TOC entry 4024 (class 2604 OID 174419)
-- Name: planeacion_plagio id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_plagio ALTER COLUMN id SET DEFAULT nextval('public.planeacion_plagio_id_seq'::regclass);


--
-- TOC entry 4030 (class 2604 OID 174420)
-- Name: planeacion_referencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_referencias ALTER COLUMN id SET DEFAULT nextval('public.planeacion_referencias_id_seq'::regclass);


--
-- TOC entry 4033 (class 2604 OID 174421)
-- Name: planeacion_relaciones_ejes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_relaciones_ejes ALTER COLUMN id SET DEFAULT nextval('public.planeacion_relaciones_ejes_id_seq'::regclass);


--
-- TOC entry 4036 (class 2604 OID 174422)
-- Name: planeaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeaciones ALTER COLUMN id SET DEFAULT nextval('public.planeaciones_id_seq'::regclass);


--
-- TOC entry 4041 (class 2604 OID 174423)
-- Name: sesiones_didacticas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_didacticas ALTER COLUMN id SET DEFAULT nextval('public.sesiones_didacticas_id_seq'::regclass);


--
-- TOC entry 4044 (class 2604 OID 174424)
-- Name: unidades_academicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_academicas ALTER COLUMN id SET DEFAULT nextval('public.unidades_academicas_id_seq'::regclass);


--
-- TOC entry 4045 (class 2604 OID 174425)
-- Name: unidades_tematicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_tematicas ALTER COLUMN id SET DEFAULT nextval('public.unidades_tematicas_id_seq'::regclass);


--
-- TOC entry 4048 (class 2604 OID 174426)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4251 (class 0 OID 174334)
-- Dependencies: 218
-- Data for Name: planeacion_datos_generales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planeacion_datos_generales (id, planeacion_id, asignatura, periodo, grupo, proposito, metodologia, consideraciones, created_at, updated_at, fecha_elaboracion, programa_academico, plan_estudios_anio, semestre_nivel, creditos_tepic, creditos_satca, grupos, area_formacion, modalidad, semanas_por_semestre, sesiones_por_semestre, sesiones_aula, sesiones_laboratorio, sesiones_clinica, sesiones_otro, horas_teoria, horas_practica, horas_aula, horas_laboratorio, horas_clinica, horas_otro, horas_total, docente_autor, academia) FROM stdin;
\.


--
-- TOC entry 4253 (class 0 OID 174342)
-- Dependencies: 220
-- Data for Name: planeacion_organizacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planeacion_organizacion (id, planeacion_id, proposito, estrategia, metodos, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4255 (class 0 OID 174350)
-- Dependencies: 222
-- Data for Name: planeacion_plagio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planeacion_plagio (id, planeacion_id, acepta_plagio, descripcion, created_at, updated_at, ithenticate, turnitin, otro) FROM stdin;
\.


--
-- TOC entry 4257 (class 0 OID 174361)
-- Dependencies: 224
-- Data for Name: planeacion_referencias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planeacion_referencias (id, planeacion_id, cita_apa, created_at, updated_at, unidades_aplica, tipo) FROM stdin;
\.


--
-- TOC entry 4259 (class 0 OID 174369)
-- Dependencies: 226
-- Data for Name: planeacion_relaciones_ejes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planeacion_relaciones_ejes (id, planeacion_id, eje_disciplinar, eje_transversal, competencias, resultados_aprendizaje, created_at, updated_at, antecedentes, laterales, subsecuentes, ejes_compromiso_social_sustentabilidad, ejes_perspectiva_genero, ejes_internacionalizacion) FROM stdin;
\.


--
-- TOC entry 4261 (class 0 OID 174377)
-- Dependencies: 228
-- Data for Name: planeaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planeaciones (id, docente_id, unidad_academica_id, nombre_planeacion, asignatura, periodo, grupo, status, secciones_completas, finalizada_at, created_at, updated_at, slug) FROM stdin;
\.


--
-- TOC entry 4263 (class 0 OID 174387)
-- Dependencies: 230
-- Data for Name: sesiones_didacticas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sesiones_didacticas (id, unidad_tematica_id, numero_sesion, temas_subtemas, actividades, valor_porcentual, evidencia, created_at, updated_at, actividades_inicio, actividades_desarrollo, actividades_cierre, recursos, evidencias, instrumentos) FROM stdin;
\.


--
-- TOC entry 4265 (class 0 OID 174395)
-- Dependencies: 232
-- Data for Name: unidades_academicas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_academicas (id, nombre, abreviatura) FROM stdin;
1	Unidad Profesional Interdisciplinaria en Ingeniería y Tecnologías Avanzadas	UPIITA
2	Escuela Superior de Ingeniería Mecánica y Eléctrica Unidad Zacatenco	ESIME Zacatenco
3	Unidad Profesional Interdisciplinaria de Ingeniería y Ciencias Sociales y Administrativas	UPIICSA
\.


--
-- TOC entry 4267 (class 0 OID 174399)
-- Dependencies: 234
-- Data for Name: unidades_tematicas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_tematicas (id, planeacion_id, numero, nombre_unidad_tematica, horas, sesiones_por_espacio, sesiones_totales, porcentaje, created_at, updated_at, unidad_competencia, periodo_del, periodo_al, horas_aula, horas_laboratorio, horas_taller, horas_clinica, horas_otro, sesiones_aula, sesiones_laboratorio, sesiones_taller, sesiones_clinica, sesiones_otro, periodo_registro_eval, aprendizajes_esperados, precisiones) FROM stdin;
\.


--
-- TOC entry 4269 (class 0 OID 174407)
-- Dependencies: 236
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, unidad_id, nombre_completo, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
1	1	Vidal Salazar Sánchez	vsalazars@ipn.mx	$2a$10$EkDcjUPBxieBYjkAQSx.Te2Y7BwTrGmaQ081fR5v4Qmmh8IJWULgS	profesor	t	2025-12-12 12:55:11.754588-06	2025-12-12 12:55:11.754588-06
3	3	Vidal Salazar Sánchez	vidalsalazarsanchez@gmail.com	i7Wl4BxPBS52MaM85ZsOxy9d-zuli01UlG9lDlt-Wnw	profesor	t	2025-12-13 12:55:28.652773-06	2025-12-13 12:55:28.652773-06
\.


--
-- TOC entry 4287 (class 0 OID 0)
-- Dependencies: 219
-- Name: planeacion_datos_generales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planeacion_datos_generales_id_seq', 65, true);


--
-- TOC entry 4288 (class 0 OID 0)
-- Dependencies: 221
-- Name: planeacion_organizacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planeacion_organizacion_id_seq', 65, true);


--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 223
-- Name: planeacion_plagio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planeacion_plagio_id_seq', 65, true);


--
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 225
-- Name: planeacion_referencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planeacion_referencias_id_seq', 130, true);


--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 227
-- Name: planeacion_relaciones_ejes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planeacion_relaciones_ejes_id_seq', 65, true);


--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 229
-- Name: planeaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.planeaciones_id_seq', 78, true);


--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 231
-- Name: sesiones_didacticas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sesiones_didacticas_id_seq', 700, true);


--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 233
-- Name: unidades_academicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.unidades_academicas_id_seq', 3, true);


--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 235
-- Name: unidades_tematicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.unidades_tematicas_id_seq', 682, true);


--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 237
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- TOC entry 4054 (class 2606 OID 174428)
-- Name: planeacion_datos_generales planeacion_datos_generales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_datos_generales
    ADD CONSTRAINT planeacion_datos_generales_pkey PRIMARY KEY (id);


--
-- TOC entry 4058 (class 2606 OID 174430)
-- Name: planeacion_organizacion planeacion_organizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_organizacion
    ADD CONSTRAINT planeacion_organizacion_pkey PRIMARY KEY (id);


--
-- TOC entry 4060 (class 2606 OID 174432)
-- Name: planeacion_plagio planeacion_plagio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_plagio
    ADD CONSTRAINT planeacion_plagio_pkey PRIMARY KEY (id);


--
-- TOC entry 4062 (class 2606 OID 174434)
-- Name: planeacion_referencias planeacion_referencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_referencias
    ADD CONSTRAINT planeacion_referencias_pkey PRIMARY KEY (id);


--
-- TOC entry 4064 (class 2606 OID 174436)
-- Name: planeacion_relaciones_ejes planeacion_relaciones_ejes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_relaciones_ejes
    ADD CONSTRAINT planeacion_relaciones_ejes_pkey PRIMARY KEY (id);


--
-- TOC entry 4070 (class 2606 OID 174438)
-- Name: planeaciones planeaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeaciones
    ADD CONSTRAINT planeaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4074 (class 2606 OID 174440)
-- Name: sesiones_didacticas sesiones_didacticas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_didacticas
    ADD CONSTRAINT sesiones_didacticas_pkey PRIMARY KEY (id);


--
-- TOC entry 4076 (class 2606 OID 174442)
-- Name: unidades_academicas unidades_academicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_academicas
    ADD CONSTRAINT unidades_academicas_pkey PRIMARY KEY (id);


--
-- TOC entry 4079 (class 2606 OID 174444)
-- Name: unidades_tematicas unidades_tematicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_tematicas
    ADD CONSTRAINT unidades_tematicas_pkey PRIMARY KEY (id);


--
-- TOC entry 4056 (class 2606 OID 174446)
-- Name: planeacion_datos_generales unique_planeacion_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_datos_generales
    ADD CONSTRAINT unique_planeacion_id UNIQUE (planeacion_id);


--
-- TOC entry 4084 (class 2606 OID 174448)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4086 (class 2606 OID 174450)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4065 (class 1259 OID 174601)
-- Name: idx_planeaciones_asignatura_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planeaciones_asignatura_trgm ON public.planeaciones USING gin (asignatura public.gin_trgm_ops);


--
-- TOC entry 4066 (class 1259 OID 174451)
-- Name: idx_planeaciones_docente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planeaciones_docente ON public.planeaciones USING btree (docente_id);


--
-- TOC entry 4067 (class 1259 OID 174602)
-- Name: idx_planeaciones_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_planeaciones_slug_unique ON public.planeaciones USING btree (slug) WHERE (slug IS NOT NULL);


--
-- TOC entry 4068 (class 1259 OID 174452)
-- Name: idx_planeaciones_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planeaciones_status ON public.planeaciones USING btree (status);


--
-- TOC entry 4072 (class 1259 OID 174453)
-- Name: idx_sesiones_unidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sesiones_unidad ON public.sesiones_didacticas USING btree (unidad_tematica_id);


--
-- TOC entry 4077 (class 1259 OID 174454)
-- Name: idx_unidades_planeacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_planeacion ON public.unidades_tematicas USING btree (planeacion_id);


--
-- TOC entry 4080 (class 1259 OID 174600)
-- Name: idx_usuarios_nombre_completo_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_nombre_completo_trgm ON public.usuarios USING gin (nombre_completo public.gin_trgm_ops);


--
-- TOC entry 4081 (class 1259 OID 174455)
-- Name: idx_usuarios_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role);


--
-- TOC entry 4082 (class 1259 OID 174456)
-- Name: idx_usuarios_unidad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_unidad_id ON public.usuarios USING btree (unidad_id);


--
-- TOC entry 4071 (class 1259 OID 174603)
-- Name: planeaciones_slug_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX planeaciones_slug_uniq ON public.planeaciones USING btree (slug) WHERE ((slug IS NOT NULL) AND (slug <> ''::text));


--
-- TOC entry 4097 (class 2620 OID 174457)
-- Name: planeacion_datos_generales trg_pdg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pdg_updated_at BEFORE UPDATE ON public.planeacion_datos_generales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4098 (class 2620 OID 174458)
-- Name: planeacion_organizacion trg_planeacion_organizacion_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_planeacion_organizacion_updated_at BEFORE UPDATE ON public.planeacion_organizacion FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4102 (class 2620 OID 174459)
-- Name: planeaciones trg_planeaciones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_planeaciones_updated_at BEFORE UPDATE ON public.planeaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4099 (class 2620 OID 174460)
-- Name: planeacion_plagio trg_pp_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pp_updated_at BEFORE UPDATE ON public.planeacion_plagio FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4101 (class 2620 OID 174461)
-- Name: planeacion_relaciones_ejes trg_pre_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pre_updated_at BEFORE UPDATE ON public.planeacion_relaciones_ejes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4100 (class 2620 OID 174462)
-- Name: planeacion_referencias trg_pref_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pref_updated_at BEFORE UPDATE ON public.planeacion_referencias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4103 (class 2620 OID 174463)
-- Name: sesiones_didacticas trg_sd_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sd_updated_at BEFORE UPDATE ON public.sesiones_didacticas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4105 (class 2620 OID 174464)
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4104 (class 2620 OID 174465)
-- Name: unidades_tematicas trg_ut_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ut_updated_at BEFORE UPDATE ON public.unidades_tematicas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 4087 (class 2606 OID 174466)
-- Name: planeacion_datos_generales planeacion_datos_generales_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_datos_generales
    ADD CONSTRAINT planeacion_datos_generales_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4088 (class 2606 OID 174471)
-- Name: planeacion_organizacion planeacion_organizacion_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_organizacion
    ADD CONSTRAINT planeacion_organizacion_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4089 (class 2606 OID 174476)
-- Name: planeacion_plagio planeacion_plagio_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_plagio
    ADD CONSTRAINT planeacion_plagio_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4090 (class 2606 OID 174481)
-- Name: planeacion_referencias planeacion_referencias_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_referencias
    ADD CONSTRAINT planeacion_referencias_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4091 (class 2606 OID 174486)
-- Name: planeacion_relaciones_ejes planeacion_relaciones_ejes_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeacion_relaciones_ejes
    ADD CONSTRAINT planeacion_relaciones_ejes_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4092 (class 2606 OID 174491)
-- Name: planeaciones planeaciones_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeaciones
    ADD CONSTRAINT planeaciones_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4093 (class 2606 OID 174496)
-- Name: planeaciones planeaciones_unidad_academica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planeaciones
    ADD CONSTRAINT planeaciones_unidad_academica_id_fkey FOREIGN KEY (unidad_academica_id) REFERENCES public.unidades_academicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4094 (class 2606 OID 174501)
-- Name: sesiones_didacticas sesiones_didacticas_unidad_tematica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_didacticas
    ADD CONSTRAINT sesiones_didacticas_unidad_tematica_id_fkey FOREIGN KEY (unidad_tematica_id) REFERENCES public.unidades_tematicas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4095 (class 2606 OID 174506)
-- Name: unidades_tematicas unidades_tematicas_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_tematicas
    ADD CONSTRAINT unidades_tematicas_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4096 (class 2606 OID 174511)
-- Name: usuarios usuarios_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades_academicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2025-12-15 22:12:00 CST

--
-- PostgreSQL database dump complete
--

