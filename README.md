# Background

CAPBuilder is a SAP Cloud Application Programming Model(Node.js) Application that allows Developers to jumpstart their projects by defining and modelling Service/Applications via a Fiori Interface, and then download a working project

CAP Builder has the following features:

- AI Project creation via a text prompt
- AI Data Generation
- Downloading a zip of all generation code including a fiori elements application
- Live Preview of your application
- Downloading your tempalte file to share with othes.

Through the User Interface the following aspects of a Service/Application can be modelled:

- Entities - Both Master Data and Managed
  - The Fields of an Entity including
    - Field Types and keys
    - Labels
    - If the Field is Mandatory, Read Only, Optional
    - In what Order and what Facet the Field should appear
    - If the Field should appear in List view and/or the Object Page
  - Facets
  - Actions
  - Value Helps
- Entity Associations - N Levels Deep
- Roles and Authorisations for the Service

CAPBuilder aims to automate the first 50% of Development, allowing Developers to focus on the most value adding parts.

Why is this tool required when SAP has Joule? This is a free(AI Costs apply) Open Source alternative. Not all of have access to SAP Build Code! Plus there is something nice about Open Source tools to go with our Open Source Technology Stack

# Demo

https://youtu.be/18X6PksGrnw

# Getting Started

```
git clone https://github.com/MertSAP/capbuilder.git
cd capbuilder
npm i
cds serve
```

# Using the AI Features

- CAP Builder using OpenAI and you will need a API Key to use these features
- You can get your API Key here: https://platform.openai.com/docs/overview
- You will need buy credits. Each request costs several around $0.02 USD
- Once you have a key you can configure the AI via the Configure AI action in the top right of the app

## User Interface - Note Worthy Options

#### General

- All Technical Names need to be made up of letters only
- Entity Technical Names must be unique at the Service Level
- Fields must be unique at the Entity Level

#### Association

Associations link Entities together. Currently only 1 to many associations are supported.
Restrictions

- An Entity can not be Associated with itself
- Master Data Entities can only be associated with other Master Data Entities
- Non Master Data Entities(Managed) can only be associated with other Non Master Data Entities(Managed)
- Although App Templater will allow Circular Associations(Travel -> Booking -> Booking Supplement -> Travel), the current version of CAPGEN will not
