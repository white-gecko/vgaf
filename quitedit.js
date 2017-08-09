"use strict";

var edit;

require([
    'rdfjson/Graph',              //Rdfjson Graph API
    'jsonld/jsonld',
    'rdforms/template/ItemStore', //Stores all the RDForm templates
    'rdforms/view/Editor',        //The editor User interface
    'dojo/json',                          //Json parser
    'dojo/text!../sampleRDF.json',         //The sample RDF
    'dojo/text!../sampleTemplate.json',    //The sample template
    'dojo/text!../configuration.json',     //The editor configuration RDF
    'dojo/domReady!'             //Wait until the dom is ready.
], function(Graph, jsonld, ItemStore, Editor, json, sampleRDF, sampleTemplate, configuration) {
    /**
     * @return {Object} a plain RDF JSON object without the additional artifacts created by this Graph class.
     * The returned object is suitable for serilization and communicated with other systems.
     */
    Graph.prototype.exportJSONLD = function () {
        var graph = this._graph, ngraph = [];
        for (var s in graph) {
            if (graph.hasOwnProperty(s)) {
                for (var p in graph[s]) {
                    if (graph[s].hasOwnProperty(p)) {
                        var objArr = graph[s][p];
                        for (var oindex = objArr.length - 1; oindex >= 0; oindex--) {
                            var o = objArr[oindex];
                            if (o.type == "uri") {
                                var object = { "@id": o.value }
                            } else {
                                var object = { "@value": o.value }
                                if (o.lang != null) {
                                    object["@language"] = o.lang;
                                }
                                if (o.datatype != null) {
                                    object["@type"] = o.datatype;
                                }
                            }
                            var subject = {"@id": s};
                            subject[p] = object;
                            ngraph.push(subject);
                        }
                    }
                }
            }
        }
        return ngraph;
    };

    function QuitEdit () {
        // this.graph = undefined;
        this.graph = new Graph();
        this.editor = undefined;

        this.openEditor = function(resourceUri, graph, parentNode) {
            this.resourceUri = resourceUri;

            var newEditor = document.createElement('div');
            parentNode.appendChild(newEditor);

            if (this.graph == undefined) {
                console.log("The Graph is not yet initialized!");
                this.graph = new Graph();
            }

            if (this.editor != undefined) {
                console.log("Remove Editor");
                this.editor.destroy();
            }

            var itemStore = new ItemStore();
            var bundle = itemStore.registerBundle({source: json.parse(sampleTemplate)});

            this.editor = new Editor({
                graph: graph,
                resource: this.resourceUri,
                template: bundle.getRoot(),
                compact: true,
                languages: [
                        {"value": "", label: {"en": "", "sv": ""}},
                        {"value": "en", label: {"en": "English", "sv": "Engelska", "de": "Englisch"}},
                        {"value": "jp", label: {"en": "Japanese", "de": "Japanisch"}},
                        {"value": "de", label: {"en": "German", "sv": "Tyska", "de": "Deutsch"}},
                        {"value": "sv", label: {"en": "Swedish", "sv": "Svenska", "de": "Schwedisch"}},
                        {"value": "pl", label: {"en": "Polish", "de": "Polnisch"}}
                    ]
            }, newEditor);
        };

        this.openEditorForResource = function(form) {
            var resourceUri = form.resourceUri.value;
            console.log(resourceUri);
            // var graph = new Graph(json.parse(sampleRDF));
            this.openEditor(resourceUri, this.graph, $("#editorContainer")[0]);

            // disable form
            // var limit = form.elements.length;
            // for (var i=0;i<limit;i++) {
            //     form.elements[i].disabled = true;
            // }
        }

        this.log = function (form) {
            this.resourceUri = form.resourceUri.value;
            var nquadsPromise = jsonld.promises.toRDF(this.graph.exportJSONLD(), {format: 'application/nquads'});
            nquadsPromise.then(function(nquads) {
                // nquads is a string of nquads
                console.log(nquads);
            }, function(err) {
                console.log(err);
            });
        };

        this.send = function (event) {

            this.endpointLocation = event.target.endpointLocation.value;
            this.graphUri = event.target.graphUri.value;

            var nquadsPromise = jsonld.promises.toRDF(this.graph.exportJSONLD(), {format: 'application/nquads'});
            nquadsPromise.then(function(nquads) {
                edit.sendDataToEndpoint(nquads);
            }, function(err) {
                console.log(err);
            });

        };

        this.sendDataToEndpoint = function (nquads) {
            // nquads is a string of nquads
            console.log(nquads);

            var updateQuery = "insert data { \n" +
                "   graph <" + this.graphUri + "> {\n" +
                nquads +
                "   }\n" +
                "}\n";

            console.log(updateQuery);

            $.ajax({
                url: this.endpointLocation,
                data: { query: updateQuery },
                dataType: "json",
                statusCode: {
                    400: function (error) {
                        //Whatever you want to do if there's an error.
                        console.log(error);
                    }
                },
                success: function (data) {
                    console.log(data);
                }
            });
        };
    }

    configuration = json.parse(configuration);

    if (configuration.endpointLocation != undefined && configuration.endpointLocation != "") {
        $('.editorForm input[name="endpointLocation"]').val(configuration.endpointLocation);
    }

    if (configuration.graphUri != undefined && configuration.graphUri != "") {
        $('.editorForm input[name="graphUri"]').val(configuration.graphUri);
    }

    if (configuration.resourceUri != undefined && configuration.resourceUri != "") {
        $('.editorForm input[name="resourceUri"]').val(configuration.resourceUri);
    }

    edit = new QuitEdit();

    $(".editorForm").submit(function(event){
        event.preventDefault();
        edit.send(event);
    });

});
