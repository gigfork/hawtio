
module Source {

  export function IndexController($scope, $location, $routeParams, workspace:Workspace, jolokia) {

    $scope.pageId = Wiki.pageId($routeParams, $location);
    $scope.mavenCoords = $routeParams["mavenCoords"];
    var fileName = $scope.pageId;

    $scope.loadingMessage = "Loading source code from artifacts <b>" + $scope.mavenCoords + "</b>";

    createBreadcrumbs();

    $scope.setFileName = (breadcrumb) => {
      fileName = Core.trimLeading(breadcrumb.fileName, "/");
      fileName = Core.trimLeading(fileName, "/");
      console.log("selected fileName '" + fileName + "'");
      createBreadcrumbs();
      filterFileNames();
    };

    $scope.$watch('workspace.tree', function () {
      if (!$scope.git && Git.getGitMBean(workspace)) {
        // lets do this asynchronously to avoid Error: $digest already in progress
        //console.log("Reloading the view as we now seem to have a git mbean!");
        setTimeout(updateView, 50);
      }
    });

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateView, 50);
    });

    function filterFileNames() {
      if (fileName) {
        $scope.sourceFiles = $scope.allSourceFiles.filter(n => n && n.startsWith(fileName)).map(n => n.substring(fileName.length + 1)).filter(n => n);
      } else {
        $scope.sourceFiles = $scope.allSourceFiles;
      }
    }

    $scope.sourceLinks = (aFile) => {
      var name = aFile;
      var paths = null;
      var idx = aFile.lastIndexOf('/');
      if (idx > 0) {
        name = aFile.substring(idx + 1);
        paths = aFile.substring(0, idx);
      }
      var answer = "";
      var fullName = fileName || "";
      if (paths) {
        angular.forEach(paths.split("/"), (path) => {
          fullName += "/" + path;
          answer += "<a href='#/source/index/" + $scope.mavenCoords + "//" + fullName + "'>" + path + "</a>/"
        });
      }
      answer += "<a href='#/source/view/" + $scope.mavenCoords + "//" + fullName + "/" + name + "'>" + name + "</a>";
      return answer;
    };

    function createBreadcrumbs() {
      $scope.breadcrumbs = Source.createBreadcrumbLinks($scope.mavenCoords, fileName);
      angular.forEach($scope.breadcrumbs, (breadcrumb) => {
        breadcrumb.active = false;
      });
      $scope.breadcrumbs.last().active = true;
    }

    function viewContents(response) {
      if (response) {
        $scope.allSourceFiles = response.split("\n").map(n => n.trim()).filter(n => n);
      } else {
        $scope.allSourceFiles = [];
      }
      filterFileNames();
      $scope.loadingMessage = null;
      if (!response) {
        var time = new Date().getTime();
        if (!$scope.lastErrorTime || time - $scope.lastErrorTime > 3000) {
          $scope.lastErrorTime = time;
          notification("error", "Could not download the source code for the maven artifacts: " + $scope.mavenCoords);
        }
      }
      Core.$apply($scope);
    }

    function updateView() {
      var mbean = Source.getInsightMBean(workspace);
      if (mbean) {
        jolokia.execute(mbean, "getSource", $scope.mavenCoords, null, "/", onSuccess(viewContents));
      }
    }

  }
}